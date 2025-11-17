import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseInterceptors, UseFilters } from '@nestjs/common';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { ChatsService } from './services/chats.service';
import { ChatCacheService } from './services/chat-cache.service';
import { MessageIdResolverService } from './services/message-id-resolver.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WsResponseInterceptor } from '../common/interceptors/ws-response.interceptor';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { EmailService } from '../email/email.service';

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      userId: string;
      profileId: string;
      email: string;
      userType: string;
      status: string;
      jti: string;
    };
  };
}

interface MessageData {
  chatId: string;
  messageId: string;
  senderId: string;
  content?: string;
  attachments?: any[];
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
      : [],
    credentials: true,
  },
  namespace: '/chat',
  connectionStateRecovery: {
    // Keep session state for 2 minutes after disconnection
    maxDisconnectionDuration: 2 * 60 * 1000,
    // Skip authentication middleware on successful recovery
    skipMiddlewares: true,
  },
})
@UseFilters(WsExceptionFilter)
@UseInterceptors(WsResponseInterceptor)
export class ChatsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatsGateway.name);
  private isAdapterReady = false;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly cache: ChatCacheService,
    private readonly messageIdResolver: MessageIdResolverService,
    @InjectQueue('messages') private readonly messagesQueue: Queue,
    private readonly wsAuthGuard: WsAuthGuard,
    public readonly emailService: EmailService,
  ) {}

  /**
   * Called after the server is initialized
   * Used to check if Redis adapter is ready
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Check if adapter is ready (Redis adapter should be set by now)
    setTimeout(() => {
      this.isAdapterReady = true;
      this.logger.log('Socket.IO adapter ready for room operations');
    }, 1000);
  }

  /**
   * Helper method to check if client is properly authenticated
   */
  private checkAuthentication(client: AuthenticatedSocket): string | null {
    if (!client.data?.user?.userId) {
      this.logger.warn(
        `Unauthenticated client attempted WebSocket operation: ${client.id}`,
      );
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
      return null;
    }
    return client.data.user.userId;
  }

  async handleConnection(client: AuthenticatedSocket) {
    const clientIp = client.handshake.address;
    const socketId = client.id;

    try {
      // Check if this is a recovered connection
      if ((client as any).recovered) {
        const userId = client.data?.user?.userId;

        if (userId) {
          this.logger.log(
            `🔄 Connection recovered: User ${userId}, Socket: ${socketId} (session, rooms, and data restored)`,
          );

          // Update online status with new socket ID
          await this.cache.setUserOnline(userId, client.id);

          // Send recovery confirmation
          client.emit('connection:recovered', {
            message: 'Connection successfully recovered',
            userId,
            socketId: client.id,
            recovered: true,
          });

          // Notify presence change to other participants
          try {
            await this.notifyPresenceChange(userId, true);
          } catch (error) {
            this.logger.debug(`Presence notification skipped: ${error.message}`);
          }

          return; // Skip full authentication flow
        }
      }

      // Normal authentication for new connections
      await this.wsAuthGuard.authenticateConnection(client);

      const userId = client.data?.user?.userId;

      // Double-check authentication succeeded
      if (!userId) {
        this.logger.warn(
          `Authentication failed: No user ID after auth guard, IP: ${clientIp}, Socket: ${socketId}`,
        );
        client.emit('error', {
          message: 'Authentication failed - invalid credentials',
          code: 'AUTH_FAILED',
        });
        client.disconnect(true);
        return;
      }

      this.logger.log(
        `✓ Client authenticated: User ${userId}, IP: ${clientIp}, Socket: ${socketId}`,
      );

      // Set user online status
      await this.cache.setUserOnline(userId, client.id);

      // Send successful connection acknowledgment
      client.emit('connection:established', {
        message: 'Successfully connected to messaging server',
        userId,
        socketId: client.id,
        recovered: false,
      });

      // Notify presence change to other participants
      try {
        await this.notifyPresenceChange(userId, true);
      } catch (error) {
        this.logger.debug(`Presence notification skipped: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(
        `✗ WebSocket authentication failed: IP: ${clientIp}, Socket: ${socketId}, Error: ${error.message}`,
      );
      client.emit('error', {
        message: error.message || 'Authentication failed',
        code: 'AUTH_ERROR',
      });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.user?.userId;

    if (userId) {
      this.logger.log(`Client disconnected: ${userId} (socket: ${client.id})`);

      try {
        const rooms = Array.from(client.rooms).filter(
          (room) => room.startsWith('chat:') && room !== client.id,
        );

        this.logger.debug(
          `Socket ${client.id} was in ${rooms.length} chat rooms`,
        );

        await this.cache.setUserOffline(userId);

        // Try presence notification, catch silently if adapter not ready
        try {
          await this.notifyPresenceChange(userId, false);
        } catch (error) {
          this.logger.debug(`Presence notification skipped: ${error.message}`);
        }
      } catch (error) {
        this.logger.error(`Error during disconnect cleanup: ${error.message}`);
      }
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    let isJoining = false;

    if (isJoining) {
      console.log('Already joining, skipping...');
      return;
    }

    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;
    const startTime = Date.now();

    this.logger.log(
      `🔵 [CHAT:JOIN] Event received - User: ${userId}, Chat: ${chatId}`,
    );

    isJoining = true;
    try {
      // Verify access using lightweight method (only checks participantIds)
      await this.chatsService.verifyChatAccess(chatId, userId);

      // Clean up old rooms
      const currentRooms = Array.from(client.rooms).filter(
        (room) => room.startsWith('chat:') && room !== client.id,
      );

      await Promise.all(currentRooms.map((room) => client.leave(room)));

      // Join new room
      this.logger.log(`🔵 [CHAT:JOIN] Attempting to join room: chat:${chatId}`);
      await client.join(`chat:${chatId}`);

      this.logger.log(`User ${userId} joined chat ${chatId}`);

      // Auto-mark messages as read when user joins chat
      const readAt = new Date().toISOString();

      // Reset unread count in cache
      await this.cache.resetUnreadCount(userId, chatId);

      // Queue database update to mark all unread messages as read
      // Delay to ensure any recently sent messages are in DB first
      await this.messagesQueue.add(
        'mark-read',
        {
          chatId,
          readBy: userId,
          readAt,
        },
        {
          delay: 3000, // Wait 3 seconds for messages to be persisted
          attempts: 3,
          removeOnComplete: true,
        },
      );

      // Get the other participant to notify them
      const chat = await this.cache.getCachedChat(chatId);
      if (chat) {
        const otherParticipantId = chat.participantIds.find((id) => id !== userId);

        if (otherParticipantId) {
          const otherSocketId = await this.cache.getUserSocketId(otherParticipantId);

          if (otherSocketId) {
            // Get the latest message from other participant to include in read notification
            const messages = await this.cache.getCachedMessages(chatId, 50);
            const latestMessageFromOther = messages
              .filter((msg) => msg.senderId === otherParticipantId)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            const messageId = latestMessageFromOther?.id || '';

            // Notify the sender that their messages were read
            // Use the messageId as-is (could be temp ID or real ID)
            this.server.to(otherSocketId).emit('message:read', {
              chatId,
              readBy: userId,
              readAt,
              messageId: messageId, // Use temp ID if that's what we have
            });

            this.logger.debug(`Notified user ${otherParticipantId} that ${userId} read messages in chat ${chatId}`);
          }
        }
      }

      // Prepare response data
      const responseData = {
        message: 'Joined chat',
        data: { chatId },
        event: 'chat:joined',
      };

      // EXPLICITLY emit confirmation to the client
      client.emit('chat:joined', responseData);

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error joining chat: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:join-error', {
        error: error.message || 'Failed to join chat',
        chatId,
      });

      throw new WsException(error.message || 'Failed to join chat');
    } finally {
      isJoining = false
    }
  }

  @SubscribeMessage('chat:leave')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;

    try {
      const roomName = `chat:${chatId}`;
      const rooms = Array.from(client.rooms);

      // Only leave if actually in the room
      if (rooms.includes(roomName)) {
        await client.leave(roomName);
        this.logger.log(`User ${userId} left chat ${chatId}`);
      } else {
        this.logger.debug(
          `User ${userId} tried to leave chat ${chatId} but was not in room`,
        );
      }

      // Prepare response data
      const responseData = {
        message: 'Left chat successfully',
        data: { chatId },
        event: 'chat:left',
      };

      // EXPLICITLY emit confirmation to the client
      client.emit('chat:left', responseData);

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error leaving chat: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:leave-error', {
        error: error.message || 'Failed to leave chat',
        chatId,
      });

      throw new WsException('Failed to leave chat');
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      chatId: string;
      message: {
        content?: string;
        attachments?: Array<{
          name: string;
          url: string;
          category: string;
          mimeType: string;
          size?: number;
        }>;
      };
    },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const {
      chatId,
      message: { content, attachments },
    } = data;

    try {
      // Validate that at least content or attachments exist
      if (!content && (!attachments || attachments.length === 0)) {
        throw new WsException('Message must have content or attachments');
      }

      // Generate temporary ID for instant UI feedback
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Register temp ID as pending in Redis
      await this.messageIdResolver.registerPendingTempId(tempId);

      this.logger.debug(`Generated temp ID ${tempId} for message in chat ${chatId}`);

      const result = await this.chatsService.sendMessage(chatId, userId, {
        content,
        attachments,
      });

      const { messageId: realMessageId, messageData, participantIds, recipientId } =
        result.data;

      // Store the mapping: temp ID → real ID in Redis
      await this.messageIdResolver.storeTempIdMapping(tempId, realMessageId);

      this.logger.debug(`Mapped temp ID ${tempId} → real ID ${realMessageId}`);

      // Queue database insert with the real ID
      const dbJob = await this.messagesQueue.add('batch-insert', messageData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.debug(
        `Message ${realMessageId} queued for DB insert (Job: ${dbJob.id})`,
      );

      // Debug logging for message structure
      this.logger.debug(
        `Message structure - Content: ${!!content}, Attachments: ${attachments?.length || 0}, RecipientId: ${recipientId}`,
      );

      // Send message directly to recipient via their socketId
      // This ensures delivery whether they're in the chat room or not
      if (recipientId) {
        const recipientSocketId = await this.cache.getUserSocketId(recipientId);
        this.logger.debug(`Recipient ${recipientId} socketId: ${recipientSocketId}`);

        if (recipientSocketId) {
          // Build message for RECIPIENT with REAL ID (they don't know about temp IDs)
          const messageToRecipient = {
            chatId,
            message: {
              id: realMessageId, // Use REAL ID for recipient
              timestamp,
              ...(content && { content }),
              ...(attachments?.length && { attachments }),
              from: 'THEM',
              status: 'DELIVERED',
            },
          };

          this.logger.debug(`Sending to recipient: ${JSON.stringify(messageToRecipient)}`);

          this.server.to(recipientSocketId).emit('message:receive', messageToRecipient);

          this.logger.debug(`✅ Message emitted to recipient ${recipientId} via socket ${recipientSocketId}`);

          const isInChatRoom = await this.isSocketInRoom(
            recipientSocketId,
            `chat:${chatId}`,
          );

          if (!isInChatRoom) {
            // Recipient not in chat room - increment unread
            await this.cache.incrementUnreadCount(recipientId, chatId);
            this.logger.debug(
              `Incremented unread count for ${recipientId} in chat ${chatId}`,
            );
          } else {
            // Recipient IS in chat room - they will see the message immediately
            // So mark as delivered AND read, then notify sender

            this.logger.debug(`Recipient ${recipientId} is in chat room, auto-marking as read`);

            // Reset unread count (shouldn't have any, but just in case)
            await this.cache.resetUnreadCount(recipientId, chatId);

            // Queue BOTH delivery and read updates
            await this.messagesQueue.add('mark-delivered', {
              messageId: realMessageId,
              deliveredAt: timestamp,
            });

            const readAt = new Date().toISOString();
            // Delay mark-read to ensure message is in DB first (after batch-insert runs)
            await this.messagesQueue.add('mark-read', {
              chatId,
              readBy: recipientId,
              readAt,
            }, {
              delay: 3000, // Wait 3 seconds for message to be persisted
              attempts: 3,
              removeOnComplete: true,
            });

            // Notify sender about READ status (skip DELIVERED, go straight to READ)
            // Use temp ID so sender's optimistic UI can match
            this.server.to(client.id).emit('message:read', {
              chatId,
              messageId: tempId, // Use temp ID for optimistic UI matching
            });

            this.logger.debug(`Notified sender ${userId} that message was read by ${recipientId}`);
          }

          this.logger.debug(`Message sent to recipient ${recipientId}`);
        } else {
          // Recipient offline - increment unread
          await this.cache.incrementUnreadCount(recipientId, chatId);
          this.logger.debug(`Recipient ${recipientId} offline, incremented unread count`);
        }
      }

      // Emit acknowledgment to sender with real ID mapping
      // This allows the client to replace temp ID with real ID in their UI
      client.emit('message:id-resolved', {
        tempId,
        realId: realMessageId,
        chatId,
        timestamp,
      });

      // Build acknowledgment response for SENDER with TEMP ID (for optimistic UI)
      const responseMessage = {
        id: tempId, // Sender uses temp ID for optimistic updates
        timestamp,
        ...(content && { content }),
        ...(attachments?.length && { attachments }),
        from: 'ME' as const,
        status: 'SENT' as const,
      };

      return {
        message: result.message,
        data: {
          message: responseMessage,
        },
        event: 'message:sent',
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      throw new WsException(error.message || 'Failed to send message');
    }
  }

  @SubscribeMessage('message:update')
  async handleUpdateMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      chatId: string;
      message: {
        id: string;
        content?: string;
        attachments?: Array<{
          name: string;
          url: string;
          category: string;
          mimeType: string;
          size?: number;
        }>;
      };
    },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId, message: updateData } = data;
    const { id: messageId, content, attachments } = updateData;

    try {
      const result = await this.chatsService.updateMessage(
        chatId,
        userId,
        messageId,
        { content, attachments },
      );

      // Broadcast update to all participants in the chat room
      this.server.to(`chat:${chatId}`).emit('message:update', {
        chatId,
        message: result.data.updatePayload,
      });

      // Queue database update
      await this.messagesQueue.add(
        'update-message',
        {
          messageId,
          chatId,
          ...result.data.updatePayload,
          updatedAt: result.data.timestamp,
        },
        {
          attempts: 3,
          removeOnComplete: true,
        },
      );

      return {
        message: result.message,
        data: { messageId, chatId },
        event: 'message:updated',
      };
    } catch (error) {
      this.logger.error(`Error updating message: ${error.message}`);
      throw new WsException(error.message || 'Failed to update message');
    }
  }

  @SubscribeMessage('message:delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { messageId, chatId } = data;

    try {
      this.logger.debug(`Message ${messageId} delivered to user ${userId}`);

      return {
        message: 'Message delivery confirmed',
        data: { messageId, chatId },
        event: 'message:delivery-confirmed',
      };
    } catch (error) {
      this.logger.error(`Error confirming delivery: ${error.message}`);
      throw new WsException('Failed to confirm delivery');
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; messageId?: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId, messageId } = data;

    try {
      const readAt = new Date().toISOString();

      // Reset unread count in cache
      await this.cache.resetUnreadCount(userId, chatId);

      // Queue database update for readAt (marks ALL unread messages in chat)
      // Add delay to ensure messages are persisted first
      await this.messagesQueue.add(
        'mark-read',
        {
          chatId,
          readBy: userId,
          readAt,
        },
        {
          delay: 3000, // Wait 3 seconds for messages to be persisted
          attempts: 3,
          removeOnComplete: true,
        },
      );

      // Get the other participant to notify them directly
      const chat = await this.cache.getCachedChat(chatId);
      let finalMessageId = messageId;

      if (chat) {
        const otherParticipantId = chat.participantIds.find((id) => id !== userId);

        if (otherParticipantId) {
          const otherSocketId = await this.cache.getUserSocketId(otherParticipantId);

          if (otherSocketId) {
            // If messageId not provided, get the latest message from other participant
            let actualMessageId = messageId;
            if (!actualMessageId) {
              const messages = await this.cache.getCachedMessages(chatId, 50);
              const latestMessageFromOther = messages
                .filter((msg) => msg.senderId === otherParticipantId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
              actualMessageId = latestMessageFromOther?.id || '';
            }

            finalMessageId = actualMessageId;

            // Check if there's a temp ID mapping for this real ID
            // This solves the race condition where sender has temp ID but recipient has real ID
            const tempId = await this.messageIdResolver.resolveToTempId(actualMessageId);

            // Notify the sender directly that their messages were read
            // Use temp ID if it exists (for optimistic UI), otherwise use real ID
            this.server.to(otherSocketId).emit('message:read', {
              chatId,
              messageId: tempId || actualMessageId, // Prefer temp ID so sender's optimistic UI can match
            });

            this.logger.debug(`Notified user ${otherParticipantId} that ${userId} read messages in chat ${chatId}`);
          }
        }
      }

      // Return consistent API response format
      return {
        success: true,
        message: 'Messages marked as read successfully',
        data: {
          chatId,
          messageId: finalMessageId,
          readAt
        },
      };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`);
      throw new WsException('Failed to mark message as read');
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;

    // Broadcast to others in the room (not including sender)
    client.to(`chat:${chatId}`).emit('typing:start', {
      chatId,
      userId,
    });

    return { message: 'Typing indicator sent', data: { chatId } };
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;

    // Broadcast to others in the room (not including sender)
    client.to(`chat:${chatId}`).emit('typing:stop', {
      chatId,
      userId,
    });

    return { message: 'Typing stop sent', data: { chatId } };
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    try {
      // Refresh user's online status (resets TTL)
      await this.cache.setUserOnline(userId, client.id);

      return {
        message: 'Heartbeat acknowledged',
        data: { timestamp: new Date().toISOString() },
        event: 'heartbeat:ack',
      };
    } catch (error) {
      this.logger.error(`Heartbeat error: ${error.message}`);
      throw new WsException('Heartbeat failed');
    }
  }

  @SubscribeMessage('presence:request')
  async handlePresenceRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: string },
  ) {
    const requesterId = this.checkAuthentication(client);
    if (!requesterId) return;

    const { userId } = data;

    try {
      const isOnline = await this.cache.isUserOnline(userId);

      return {
        message: 'Presence status retrieved',
        data: { userId, isOnline },
        event: 'presence:status',
      };
    } catch (error) {
      this.logger.error(`Presence request error: ${error.message}`);
      throw new WsException('Failed to get presence status');
    }
  }

  @SubscribeMessage('chat:request')
  async handleCreateChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      recipientId: string;
      content?: string;
      attachments?: Array<{
        name: string;
        url: string;
        category: string;
        mimeType: string;
        size?: number;
      }>;
    },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const userType = client.data.user.userType;

    try {
      const result = await this.chatsService.createChat(
        userId,
        userType as any,
        data,
      );

      // Join the chat room immediately
      await client.join(`chat:${result.data.chat.id}`);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:created',
      };

      // EXPLICITLY emit confirmation to the client who created the chat
      client.emit('chat:created', responseData);

      this.logger.log(`Chat ${result.data.chat.id} created by user ${userId} - confirmation sent`);

      // THEN notify recipient
      const recipientSocketId = await this.cache.getUserSocketId(
        data.recipientId,
      );

      if (recipientSocketId) {
        // Send the full PendingByThemChat object directly
        this.server.to(recipientSocketId).emit('chat:request-received', result.recipientView);

        // Send updated unattended count
        const unattendedCount = await this.chatsService.getUnattendedCount(data.recipientId);
        this.server.to(recipientSocketId).emit('chat:unattended-count', unattendedCount);
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error creating chat: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:create-error', {
        error: error.message || 'Failed to create chat',
      });

      throw new WsException(error.message || 'Failed to create chat');
    }
  }

  @SubscribeMessage('chat:resend-request')
  async handleResendChatRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    try {
      const result = await this.chatsService.resendChatRequest(userId, data);

      await client.join(`chat:${result.data.chat.id}`);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:resent',
      };

      // EXPLICITLY emit confirmation to the client who resent the request
      client.emit('chat:resent', responseData);

      this.logger.log(`Chat ${result.data.chat.id} resent by user ${userId} - confirmation sent`);

      // THEN notify recipient with the appropriate retry event based on original status
      const recipientId = result.data.chat.recipient.id;
      const recipientSocketId = await this.cache.getUserSocketId(recipientId);

      if (recipientSocketId) {
        // Fetch full chat details for the recipient
        const fullChatData = await this.chatsService.getChatById(result.data.chat.id, recipientId);

        // Emit the appropriate retry event based on the original status
        const originalStatus = result.data.originalStatus;

        switch (originalStatus) {
          case 'DECLINED':
            this.server.to(recipientSocketId).emit('chat:declined-retried', fullChatData.data);
            this.logger.log(`Emitted chat:declined-retried to recipient ${recipientId}`);
            break;
          case 'ENDED':
            this.server.to(recipientSocketId).emit('chat:ended-retried', fullChatData.data);
            this.logger.log(`Emitted chat:ended-retried to recipient ${recipientId}`);
            break;
          case 'EXPIRED':
            this.server.to(recipientSocketId).emit('chat:expired-retried', fullChatData.data);
            this.logger.log(`Emitted chat:expired-retried to recipient ${recipientId}`);
            break;
        }

        // Also emit the legacy event for backward compatibility
        this.server.to(recipientSocketId).emit('chat:request-resent', {
          chatId: result.data.chat.id,
        });
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error resending chat request: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:resend-error', {
        error: error.message || 'Failed to resend chat request',
        chatId: data.chatId,
      });

      throw new WsException(error.message || 'Failed to resend chat request');
    }
  }

  @SubscribeMessage('chat:retry-declined')
  async handleRetryDeclinedChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    try {
      const result = await this.chatsService.retryDeclinedChat(userId, data);

      await client.join(`chat:${result.data.chat.id}`);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:retry-declined-confirmation',
      };

      // EXPLICITLY emit confirmation to the client who retried
      client.emit('chat:retry-declined-confirmation', responseData);

      this.logger.log(
        `Declined chat ${result.data.chat.id} retried by user ${userId} - confirmation sent`,
      );

      // THEN notify recipient with the declined-retried event
      const recipientId = result.data.chat.recipient.id;
      const recipientSocketId = await this.cache.getUserSocketId(recipientId);

      if (recipientSocketId) {
        // Fetch full chat details for the recipient
        const fullChatData = await this.chatsService.getChatById(
          result.data.chat.id,
          recipientId,
        );

        this.server
          .to(recipientSocketId)
          .emit('chat:declined-retried', fullChatData.data);
        this.logger.log(`Emitted chat:declined-retried to recipient ${recipientId}`);

        // Send updated unattended count to recipient
        const unattendedCount =
          await this.chatsService.getUnattendedCount(recipientId);
        this.server.to(recipientSocketId).emit('chat:unattended-count', unattendedCount);
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error retrying declined chat: ${error.message}`);

      throw new WsException(error.message || 'Failed to retry declined chat');
    }
  }

  @SubscribeMessage('chat:retry-ended')
  async handleRetryEndedChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    try {
      const result = await this.chatsService.retryEndedChat(userId, data);

      await client.join(`chat:${result.data.chat.id}`);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:retry-ended-confirmation',
      };

      // EXPLICITLY emit confirmation to the client who retried
      client.emit('chat:retry-ended-confirmation', responseData);

      this.logger.log(
        `Ended chat ${result.data.chat.id} retried by user ${userId} - confirmation sent`,
      );

      // THEN notify recipient with the ended-retried event
      const recipientId = result.data.chat.recipient.id;
      const recipientSocketId = await this.cache.getUserSocketId(recipientId);

      if (recipientSocketId) {
        // Fetch full chat details for the recipient
        const fullChatData = await this.chatsService.getChatById(
          result.data.chat.id,
          recipientId,
        );

        this.server
          .to(recipientSocketId)
          .emit('chat:ended-retried', fullChatData.data);
        this.logger.log(`Emitted chat:ended-retried to recipient ${recipientId}`);

        // Send updated unattended count to recipient
        const unattendedCount =
          await this.chatsService.getUnattendedCount(recipientId);
        this.server.to(recipientSocketId).emit('chat:unattended-count', unattendedCount);
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error retrying ended chat: ${error.message}`);

      throw new WsException(error.message || 'Failed to retry ended chat');
    }
  }

  @SubscribeMessage('chat:retry-expired')
  async handleRetryExpiredChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    try {
      const result = await this.chatsService.retryExpiredChat(userId, data);

      await client.join(`chat:${result.data.chat.id}`);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:retry-expired-confirmation',
      };

      // EXPLICITLY emit confirmation to the client who retried
      client.emit('chat:retry-expired-confirmation', responseData);

      this.logger.log(
        `Expired chat ${result.data.chat.id} retried by user ${userId} - confirmation sent`,
      );

      // THEN notify recipient with the expired-retried event
      const recipientId = result.data.chat.recipient.id;
      const recipientSocketId = await this.cache.getUserSocketId(recipientId);

      if (recipientSocketId) {
        // Fetch full chat details for the recipient
        const fullChatData = await this.chatsService.getChatById(
          result.data.chat.id,
          recipientId,
        );

        this.server
          .to(recipientSocketId)
          .emit('chat:expired-retried', fullChatData.data);
        this.logger.log(`Emitted chat:expired-retried to recipient ${recipientId}`);

        // Send updated unattended count to recipient
        const unattendedCount =
          await this.chatsService.getUnattendedCount(recipientId);
        this.server.to(recipientSocketId).emit('chat:unattended-count', unattendedCount);
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error retrying expired chat: ${error.message}`);

      throw new WsException(error.message || 'Failed to retry expired chat');
    }
  }

  @SubscribeMessage('chat:accept')
  async handleAcceptChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;

    try {
      const result = await this.chatsService.acceptChat(chatId, userId);

      // Join the chat room immediately
      await client.join(`chat:${chatId}`);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:accepted-confirmation',
      };

      // EXPLICITLY emit confirmation to the client who accepted (for immediate UI feedback)
      client.emit('chat:accepted-confirmation', responseData);

      // Send updated unattended count (decremented)
      const unattendedCount = await this.chatsService.getUnattendedCount(userId);
      client.emit('chat:unattended-count', unattendedCount);

      this.logger.log(`Chat ${chatId} accepted by user ${userId} - confirmation sent`);

      // THEN notify other participant directly via their socketId
      // Get chat to find the initiator (recipient of acceptance)
      const chat = await this.cache.getCachedChat(chatId);
      if (chat && result.data.expiresAt) {
        const recipientId = chat.initiatorId; // Initiator is the recipient when someone accepts

        if (recipientId) {
          const recipientSocketId = await this.cache.getUserSocketId(recipientId);
          if (recipientSocketId) {
            // Fetch full chat details to send complete object to frontend
            const fullChatData = await this.chatsService.getChatById(chatId, recipientId);

            this.server.to(recipientSocketId).emit('chat:accepted', fullChatData.data);
            this.logger.log(`Notified initiator ${recipientId} that chat ${chatId} was accepted`);
          }
        }
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error accepting chat: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:accept-error', {
        error: error.message || 'Failed to accept chat',
        chatId,
      });

      throw new WsException(error.message || 'Failed to accept chat');
    }
  }

  @SubscribeMessage('chat:decline')
  async handleDeclineChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;

    try {
      const result = await this.chatsService.declineChat(chatId, userId);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:declined-confirmation',
      };

      // EXPLICITLY emit confirmation to the client who declined
      client.emit('chat:declined-confirmation', responseData);

      // Send updated unattended count (decremented)
      const unattendedCount = await this.chatsService.getUnattendedCount(userId);
      client.emit('chat:unattended-count', unattendedCount);

      this.logger.log(`Chat ${chatId} declined by user ${userId} - confirmation sent`);

      // THEN notify the initiator directly via their socketId
      // Get chat to find the initiator (recipient of decline notification)
      const chat = await this.cache.getCachedChat(chatId);
      if (chat) {
        const recipientId = chat.initiatorId; // Initiator is the recipient when someone declines

        if (recipientId) {
          const recipientSocketId = await this.cache.getUserSocketId(recipientId);
          if (recipientSocketId) {
            // Fetch full chat details to send complete object to frontend
            const fullChatData = await this.chatsService.getChatById(chatId, recipientId);

            this.server.to(recipientSocketId).emit('chat:declined', fullChatData.data);
            this.logger.log(`Notified initiator ${recipientId} that chat ${chatId} was declined`);
          }
        }
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error declining chat: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:decline-error', {
        error: error.message || 'Failed to decline chat',
        chatId,
      });

      throw new WsException(error.message || 'Failed to decline chat');
    }
  }

  @SubscribeMessage('chat:extend')
  async handleExtendChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;

    try {
      const result = await this.chatsService.extendChat(chatId, userId);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:extended-confirmation',
      };

      // EXPLICITLY emit confirmation to the client who extended
      client.emit('chat:extended-confirmation', responseData);

      this.logger.log(`Chat ${chatId} extended by user ${userId} - confirmation sent`);

      // THEN notify other participant directly via their socketId
      // Get chat to find the recipient
      const chat = await this.cache.getCachedChat(chatId);
      if (chat && result.data.expiresAt) {
        const participantIds = chat.participantIds;
        const recipientId = participantIds.find(id => id !== userId);

        if (recipientId) {
          const recipientSocketId = await this.cache.getUserSocketId(recipientId);
          if (recipientSocketId) {
            // Fetch full chat details to send complete object to frontend
            const fullChatData = await this.chatsService.getChatById(chatId, recipientId);

            this.server.to(recipientSocketId).emit('chat:extended', fullChatData.data);
            this.logger.log(`Notified recipient ${recipientId} that chat ${chatId} was extended`);
          }
        }
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error extending chat: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:extend-error', {
        error: error.message || 'Failed to extend chat',
        chatId,
      });

      throw new WsException(error.message || 'Failed to extend chat');
    }
  }

  @SubscribeMessage('chat:end')
  async handleEndChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;

    try {
      const result = await this.chatsService.endChat(chatId, userId);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:ended-confirmation',
      };

      // EXPLICITLY emit confirmation to the client who ended the chat
      client.emit('chat:ended-confirmation', responseData);

      this.logger.log(`Chat ${chatId} ended by user ${userId} - confirmation sent`);

      // THEN notify other participant directly via their socketId
      // Get chat to find the recipient
      const chat = await this.cache.getCachedChat(chatId);
      if (chat) {
        const participantIds = chat.participantIds;
        const recipientId = participantIds.find(id => id !== userId);

        if (recipientId) {
          const recipientSocketId = await this.cache.getUserSocketId(recipientId);
          if (recipientSocketId) {
            // Fetch full chat details to send complete object to frontend
            const fullChatData = await this.chatsService.getChatById(chatId, recipientId);

            this.server.to(recipientSocketId).emit('chat:ended', fullChatData.data);
            this.logger.log(`Notified recipient ${recipientId} that chat ${chatId} was ended`);
          }
        }
      }

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error ending chat: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:end-error', {
        error: error.message || 'Failed to end chat',
        chatId,
      });

      throw new WsException(error.message || 'Failed to end chat');
    }
  }

  @SubscribeMessage('chat:delete')
  async handleDeleteChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = this.checkAuthentication(client);
    if (!userId) return;

    const { chatId } = data;

    try {
      const result = await this.chatsService.deleteChat(chatId, userId);

      // Leave the chat room
      await client.leave(`chat:${chatId}`);

      // Prepare response data
      const responseData = {
        message: result.message,
        data: result.data,
        event: 'chat:deleted-confirmation',
      };

      // EXPLICITLY emit confirmation to the client who deleted the chat
      client.emit('chat:deleted-confirmation', responseData);

      this.logger.log(`Chat ${chatId} deleted by user ${userId} - confirmation sent`);

      // Also return for acknowledgment callback compatibility
      return responseData;
    } catch (error) {
      this.logger.error(`Error deleting chat: ${error.message}`);

      // Emit error to client explicitly
      client.emit('chat:delete-error', {
        error: error.message || 'Failed to delete chat',
        chatId,
      });

      throw new WsException(error.message || 'Failed to delete chat');
    }
  }

  // Public methods for external notifications
  async notifyChatExpired(chatId: string) {
    this.server.to(`chat:${chatId}`).emit('chat:expired', {
      chatId,
      message: 'This chat has expired',
    });
  }

  async notifyChatExtended(chatId: string) {
    this.server.to(`chat:${chatId}`).emit('chat:extended', {
      chatId,
    });
  }

  async notifyChatAccepted(chatId: string, expiresAt: Date) {
    this.server.to(`chat:${chatId}`).emit('chat:accepted', {
      chatId,
      expiresAt: expiresAt.toISOString(),
    });
  }

  /**
   * Check if a socket is in a specific room
   * Works with Redis adapter across multiple instances
   */
  private async isSocketInRoom(
    socketId: string,
    roomName: string,
  ): Promise<boolean> {
    try {
      // This works with Redis adapter - fetches sockets from all instances
      const sockets = await this.server.in(roomName).fetchSockets();
      return sockets.some((socket) => socket.id === socketId);
    } catch (error) {
      this.logger.error(`Error checking room membership: ${error.message}`);
      return false;
    }
  }

  private async notifyPresenceChange(
    userId: string,
    isOnline: boolean,
  ): Promise<void> {
    try {
      // Check if server is ready
      if (!this.server?.emit) {
        throw new Error('Server not ready');
      }

      // Get chats from CACHE only - much faster, no DB query
      const chatIds = await this.cache.getUserChatIds(userId);

      if (chatIds.length === 0) {
        this.logger.debug(
          `No cached chats for user ${userId}, skipping presence notification`,
        );
        return;
      }

      // Emit to each chat room
      for (const chatId of chatIds) {
        const roomName = `chat:${chatId}`;
        this.server.to(roomName).emit('user:presence', {
          userId,
          isOnline,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.debug(
        `Presence ${isOnline ? 'online' : 'offline'} notified for user ${userId} in ${chatIds.length} chats`,
      );
    } catch (error) {
      throw new Error(`Presence notification failed: ${error.message}`);
    }
  }
}
