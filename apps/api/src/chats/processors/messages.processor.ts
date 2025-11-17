import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageIdResolverService } from '../services/message-id-resolver.service';

interface MessageJob {
  id: string;
  chatId: string;
  senderId: string;
  content: string | null;
  attachments?: Array<{
    name: string;
    url: string;
    category: string;
    mimeType: string;
    size?: number;
  }> | null;
  createdAt: string;
}

interface DeliveryJob {
  messageId: string;
  deliveredAt: string;
}

interface ReadJob {
  chatId: string;
  messageId: string;
  readBy: string;
  readAt: string;
}

interface UpdateMessageJob {
  messageId: string;
  chatId: string;
  content?: string;
  attachments?: Array<{
    name: string;
    url: string;
    category: string;
    mimeType: string;
    size?: number;
  }>;
  updatedAt: string;
}

@Processor('messages')
export class MessagesProcessor {
  private readonly logger = new Logger(MessagesProcessor.name);
  private messageBuffer: MessageJob[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 500;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageIdResolver: MessageIdResolverService,
  ) {}

  @Process('batch-insert')
  async handleBatchInsert(job: Job<MessageJob>) {
    this.messageBuffer.push(job.data);

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(() => {
      this.flushMessages();
    }, this.FLUSH_INTERVAL);

    return { buffered: true, bufferSize: this.messageBuffer.length };
  }

  private async flushMessages() {
    if (this.messageBuffer.length === 0) return;

    const messagesToInsert = [...this.messageBuffer];
    this.messageBuffer = [];

    try {
      const messages = messagesToInsert.map((msg) => ({
        id: msg.id.startsWith('temp_') ? undefined : msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        content: msg.content,
        attachments: msg.attachments || undefined,
        createdAt: new Date(msg.createdAt),
        deliveredAt: null, // Explicitly set to null for Prisma queries to work
        readAt: null, // Explicitly set to null for Prisma queries to work
      }));

      await this.prisma.message.createMany({
        data: messages,
      });

      // Update all affected chats in a single bulk operation to avoid deadlocks
      const chatIds = [...new Set(messagesToInsert.map((m) => m.chatId))];
      if (chatIds.length > 0) {
        await this.prisma.chat.updateMany({
          where: { id: { in: chatIds } },
          data: { lastMessageAt: new Date() },
        });
      }

      this.logger.log(`Flushed ${messagesToInsert.length} messages to database`);
    } catch (error) {
      this.logger.error('Error flushing messages to database:', error);
      this.messageBuffer.unshift(...messagesToInsert);
    }
  }

  @Process('mark-delivered')
  async handleMarkDelivered(job: Job<DeliveryJob>) {
    let { messageId, deliveredAt } = job.data;

    try {
      // Check if messageId is a valid MongoDB ObjectId
      if (!this.messageIdResolver.isValidObjectId(messageId)) {
        this.logger.debug(`Received temp ID ${messageId}, attempting to resolve to real ID...`);

        // It's a temp ID - resolve it to real ID
        const realId = await this.messageIdResolver.resolveToRealId(messageId, 5000);

        if (!realId) {
          // Resolution failed or timed out
          const attemptNumber = job.attemptsMade + 1;
          const maxAttempts = job.opts.attempts || 3;

          if (attemptNumber < maxAttempts) {
            this.logger.warn(
              `Failed to resolve temp ID ${messageId} (attempt ${attemptNumber}/${maxAttempts}). Will retry...`,
            );
            throw new Error(`Temp ID resolution failed - retry attempt ${attemptNumber}`);
          } else {
            this.logger.error(
              `Failed to resolve temp ID ${messageId} after ${maxAttempts} attempts. Skipping delivery update.`,
            );
            return { success: false, reason: 'temp_id_resolution_failed' };
          }
        }

        this.logger.debug(`Resolved temp ID ${messageId} → real ID ${realId}`);
        messageId = realId; // Use the real ID for database update
      }

      // Update the message with the real ObjectId
      await this.prisma.message.updateMany({
        where: {
          id: messageId,
          deliveredAt: null, // Only update if not already delivered
        },
        data: {
          deliveredAt: new Date(deliveredAt),
        },
      });

      this.logger.debug(`Message ${messageId} marked as delivered`);
    } catch (error) {
      this.logger.error(`Error marking message ${messageId} as delivered:`, error);
      throw error; // Re-throw for Bull retry mechanism
    }

    return { success: true };
  }

  @Process('mark-read')
  async handleMarkRead(job: Job<ReadJob>) {
    const { chatId, readBy, readAt } = job.data;

    try {
      // Mark all unread messages in the chat as read (excluding sender's own messages)
      // Also ensure deliveredAt is set (some messages might not have it)
      const result = await this.prisma.message.updateMany({
        where: {
          chatId,
          readAt: null,
          NOT: {
            senderId: readBy, // Don't mark own messages
          },
        },
        data: {
          deliveredAt: new Date(readAt), // Ensure deliveredAt is set
          readAt: new Date(readAt),
        },
      });

      this.logger.debug(`Messages in chat ${chatId} marked as read by ${readBy} (${result.count} messages updated)`);
    } catch (error) {
      this.logger.error(`Error marking messages as read:`, error);
      throw error; // Re-throw for Bull retry mechanism
    }

    return { success: true };
  }

  @Process('update-message')
  async handleUpdateMessage(job: Job<UpdateMessageJob>) {
    const { messageId, chatId, content, attachments, updatedAt } = job.data;

    try {
      // Build update data object with only provided fields
      const updateData: any = {
        updatedAt: new Date(updatedAt),
      };

      if (content !== undefined) {
        updateData.content = content;
      }

      if (attachments !== undefined) {
        updateData.attachments = attachments;
      }

      // Update the message in the database
      await this.prisma.message.update({
        where: { id: messageId },
        data: updateData,
      });

      this.logger.debug(
        `Message ${messageId} in chat ${chatId} updated successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating message ${messageId} in chat ${chatId}:`,
        error,
      );
      throw error; // Re-throw for Bull retry mechanism
    }

    return { success: true };
  }

  @OnQueueFailed()
  handleFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`, error.stack);
  }

  async onModuleDestroy() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    await this.flushMessages();
  }
}
