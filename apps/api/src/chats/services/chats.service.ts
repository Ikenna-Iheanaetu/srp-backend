import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Inject,
  forwardRef,
  Logger,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { ObjectId } from 'bson';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatCacheService } from './chat-cache.service';
import {
  ChatStatus,
  UserType,
  UserStatus,
  ChatEventType,
  RequestExtendEventDays,
  HireStatus,
  RequestStatus,
} from '@prisma/client';
import { CreateChatDto } from '../dto/create-chat.dto';
import {
  createPaginationMeta,
  createPaginationParams,
} from 'src/utils/pagination.utils';
import { ResendCreateChat } from '../dto/resend-create-chat.dto';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);
  private readonly CHAT_DURATION_DAYS = 21;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: ChatCacheService,
    @Inject(forwardRef(() => require('../chats.gateway').ChatsGateway))
    private readonly gateway: any,
    @InjectQueue('chat-expiry') private readonly expiryQueue: Queue,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get the number of days to add based on extension count
   * Extension schedule:
   * - 1st extension (count=0): 14 days
   * - 2nd extension (count=1): 7 days
   * - 3rd extension (count=2): 3 days
   * - 4th+ extension (count>=3): 0 days (blocked)
   */
  private getExtensionDuration(extensionCount: number): number {
    switch (extensionCount) {
      case 0:
        return 14;
      case 1:
        return 7;
      case 2:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Helper method to log chat events
   * This creates a timeline/history record for chat-related actions
   */
  async logChatEvent(
    eventType: ChatEventType,
    chatId?: string,
    requestId?: string,
    description?: string,
    extensionDays?: RequestExtendEventDays,
    metadata?: Record<string, any>,
    tx?: any,
  ) {
    const prismaClient = tx || this.prisma;

    try {
      await prismaClient.chatEvent.create({
        data: {
          chatId,
          requestId,
          eventType,
          description,
          extensionDays,
          metadata: metadata || undefined,
        },
      });

      this.logger.log(
        `Chat event logged: ${eventType}${chatId ? ` for chat ${chatId}` : ''}${requestId ? ` for request ${requestId}` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log chat event ${eventType}:`,
        error instanceof Error ? error.stack : error,
      );
      // Don't throw - event logging failure shouldn't break the main operation
    }
  }

  /**
   * Generate a unique hire request code
   */
  private generateHireRequestCode(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `HIRE-${timestamp}-${randomStr}`;
  }

  private async fetchUsersWithClubData(userId: string, recipientId: string) {
    return Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          userType: true,
          player: {
            select: {
              club: {
                select: {
                  id: true,
                  user: { select: { name: true } },
                  avatar: true,
                },
              },
            },
          },
          affiliates: {
            where: {
              type: UserType.COMPANY,
              isApproved: true,
            },
            select: {
              club: {
                select: {
                  id: true,
                  user: { select: { name: true } },
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: recipientId },
        select: {
          id: true,
          userType: true,
          status: true,
          player: {
            select: {
              club: {
                select: {
                  id: true,
                  user: { select: { name: true } },
                  avatar: true,
                },
              },
            },
          },
          affiliates: {
            where: {
              type: UserType.COMPANY,
              isApproved: true,
            },
            select: {
              club: {
                select: {
                  id: true,
                  user: { select: { name: true } },
                  avatar: true,
                },
              },
            },
          },
        },
      }),
    ]);
  }

  private validateUsers(currentUser: any, recipientUser: any) {
    if (!currentUser) {
      throw new NotFoundException({
        message: 'Current user not found',
        errors: [
          {
            field: 'userId',
            message: 'User with this ID does not exist',
            code: 'USER_NOT_FOUND',
          },
        ],
      });
    }

    if (!recipientUser) {
      throw new NotFoundException({
        message: 'Recipient not found',
        errors: [
          {
            field: 'recipientId',
            message: 'User with this ID does not exist',
            code: 'RECIPIENT_NOT_FOUND',
          },
        ],
      });
    }

    if (recipientUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestException({
        message: 'Recipient account is not active',
        errors: [
          {
            field: 'recipientId',
            message: 'Cannot create chat with inactive user',
            code: 'RECIPIENT_INACTIVE',
          },
        ],
      });
    }
  }

  private validateMessageContent(
    content: string | undefined,
    attachments: any[] | undefined,
  ) {
    if (
      (!content || content.trim().length === 0) &&
      (!attachments || attachments.length === 0)
    ) {
      throw new BadRequestException({
        message: 'Either content or attachments must be provided',
        errors: [
          {
            field: 'content',
            message: 'Message must have either text content or attachments',
            code: 'MISSING_CONTENT',
          },
        ],
      });
    }
  }

  private determineParticipantIds(
    userId: string,
    recipientId: string,
    userType: UserType,
  ): { companyId: string; playerId: string } {
    if (userType === UserType.COMPANY) {
      return {
        companyId: userId,
        playerId: recipientId,
      };
    } else if (
      userType === UserType.PLAYER ||
      userType === UserType.SUPPORTER
    ) {
      return {
        companyId: recipientId,
        playerId: userId,
      };
    } else {
      throw new ForbiddenException({
        message: 'Only Companies and Players can create chats',
        errors: [
          {
            field: 'userType',
            message: 'Unauthorized user type',
            code: 'UNAUTHORIZED_USER_TYPE',
          },
        ],
      });
    }
  }

  /**
   * Gets the recipient's club information
   */
  private getRecipientClub(recipientUser: any) {
    // For players/supporters, get their direct club
    if (recipientUser.player?.club) {
      return {
        id: recipientUser.player.club.id,
        name: recipientUser.player.club.user.name,
        avatar: recipientUser.player.club.avatar || undefined,
      };
    }

    // For companies, get their affiliate club
    const affiliateClub = recipientUser.affiliates?.[0]?.club;
    if (affiliateClub) {
      return {
        id: affiliateClub.id,
        name: affiliateClub.user.name,
        avatar: affiliateClub.avatar || undefined,
      };
    }

    // Fallback if no club found
    return {
      id: 'no-club',
      name: 'No Club',
      avatar: undefined,
    };
  }

  /**
   * Builds the chat response object
   */
  private buildChatResponse(
    chat: any,
    userId: string,
    companyId: string,
    recipientUser: any,
  ) {
    const isCompanyInitiator = userId === companyId;
    const recipient = isCompanyInitiator ? chat.player : chat.company;
    const recipientUserType = isCompanyInitiator
      ? chat.player.player
      : chat.company.company;

    return {
      id: chat.id,
      status: chat.status,
      initiatedBy: 'ME' as const,
      recipient: {
        id: recipient.id,
        profileId: recipientUserType.id,
        name: recipient.name,
        userType: recipient.userType.toLowerCase(),
        avatar: recipientUserType?.avatar,
        location: recipientUserType?.address,
        club: this.getRecipientClub(recipientUser),
      },
    };
  }

  /**
   * Formats a message for the response
   */
  private formatMessage(message: any) {
    return {
      id: message.id,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
      status: 'SENT' as const,
      from: 'ME' as const,
      attachments: (message.attachments as any[]) || [],
    };
  }

  // In your service, add this helper method:
  private async buildRecipientChatView(
    chat: any,
    senderId: string,
    senderType: UserType,
    companyId: string,
    playerId: string,
  ) {
    // Fetch sender's info
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        name: true,
        userType: true,
        player: {
          select: {
            id: true,
            avatar: true,
            address: true,
            club: {
              select: {
                id: true,
                user: { select: { name: true } },
                avatar: true,
              },
            },
          },
        },
        company: {
          select: {
            id: true,
            avatar: true,
            address: true,
          },
        },
        affiliates: {
          where: { type: 'COMPANY', isApproved: true },
          select: {
            club: {
              select: {
                id: true,
                user: { select: { name: true } },
                avatar: true,
              },
            },
          },
        },
      },
    });

    const isCompanySender = senderId === companyId;
    const senderUserType = isCompanySender ? sender?.company : sender?.player;

    return {
      id: chat.id,
      status: chat.status,
      initiatedBy: 'THEM' as const,
      recipient: {
        id: sender?.id,
        profileId: isCompanySender ? sender?.company?.id : sender?.player?.id,
        name: sender?.name,
        userType: sender?.userType.toLowerCase(),
        avatar: senderUserType?.avatar,
        location: senderUserType?.address,
        club: this.getRecipientClub(sender),
      },
    };
  }

  async createChat(userId: string, userType: UserType, dto: CreateChatDto) {
    try {
      const { recipientId, content, attachments } = dto;

      this.validateMessageContent(content, attachments);

      if (userId === recipientId) {
        throw new BadRequestException({
          message: 'Cannot create chat with yourself',
          errors: [
            {
              field: 'recipientId',
              message: 'Recipient cannot be the same as sender',
              code: 'INVALID_RECIPIENT',
            },
          ],
        });
      }

      const [currentUser, recipientUser] = await this.fetchUsersWithClubData(
        userId,
        recipientId,
      );

      this.validateUsers(currentUser, recipientUser);

      if (userType === UserType.COMPANY) {
        if (
          recipientUser!.userType !== UserType.PLAYER &&
          recipientUser!.userType !== UserType.SUPPORTER
        ) {
          throw new BadRequestException({
            message: 'Companies can only message Players or Supporters',
            errors: [
              {
                field: 'recipientId',
                message: 'Invalid recipient user type',
                code: 'INVALID_USER_TYPE',
              },
            ],
          });
        }
      } else if (
        userType === UserType.PLAYER ||
        userType === UserType.SUPPORTER
      ) {
        if (recipientUser!.userType !== UserType.COMPANY) {
          throw new BadRequestException({
            message: 'Players/Supporters can only message Companies',
            errors: [
              {
                field: 'recipientId',
                message: 'Invalid recipient user type',
                code: 'INVALID_USER_TYPE',
              },
            ],
          });
        }
      }

      const { companyId, playerId } = this.determineParticipantIds(
        userId,
        recipientId,
        userType,
      );

      const existingChat = await this.prisma.chat.findFirst({
        where: {
          companyId,
          playerId,
          status: { in: [ChatStatus.PENDING, ChatStatus.ACCEPTED] },
        },
      });

      if (existingChat) {
        throw new BadRequestException({
          message: 'An active chat already exists',
          errors: [
            {
              field: 'recipientId',
              message:
                'You already have a pending or active chat with this user',
              code: 'CHAT_EXISTS',
            },
          ],
        });
      }

      // Check for declined chat with 24-hour cooldown (only applies to declined, not ended)
      const declinedChat = await this.prisma.chat.findFirst({
        where: {
          companyId,
          playerId,
          initiatorId: userId, // Only check if current user was the initiator
          status: ChatStatus.DECLINED,
          declinedAt: { not: null },
        },
        orderBy: { declinedAt: 'desc' }, // Get most recent declined chat
      });

      if (declinedChat && declinedChat.declinedAt) {
        const hoursSinceDecline =
          (Date.now() - declinedChat.declinedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceDecline < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceDecline);
          throw new BadRequestException({
            message: 'Please wait before sending another chat request',
            errors: [
              {
                field: 'recipientId',
                message: `You must wait ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} before sending another request to this user`,
                code: 'COOLDOWN_ACTIVE',
              },
            ],
          });
        }
      }

      // Create ONLY chat (fast operation)
      const chat = await this.prisma.chat.create({
        data: {
          companyId,
          playerId,
          initiatorId: userId,
          status: ChatStatus.PENDING,
          participantIds: [companyId, playerId],
          lastMessageAt: new Date(),
          messages: {
            create: {
              senderId: userId,
              content: content?.trim() || null,
              attachments: attachments ? (attachments as any) : null,
            },
          },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
              userType: true,
              company: { select: { avatar: true, address: true, id: true } },
            },
          },
          player: {
            select: {
              id: true,
              name: true,
              userType: true,
              player: { select: { avatar: true, address: true, id: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              senderId: true,
              content: true,
              attachments: true,
              createdAt: true,
            },
          },
        },
      });

      // Validate company and player profiles exist
      if (!chat.company.company?.id || !chat.player.player?.id) {
        this.logger.error(
          `Missing profile IDs for chat ${chat.id}. Company: ${chat.company.company?.id}, Player: ${chat.player.player?.id}`,
        );
      } else {
        // Create HireRequest asynchronously (non-blocking, fire and forget)
        this.createHireRequestAsync(
          chat.id,
          chat.company.company.id,
          chat.player.player.id,
          userId,
          recipientId,
        ).catch((error) => {
          this.logger.error(
            `Async HireRequest creation failed: ${error.message}`,
          );
        });
      }

      // Log CHAT_INITIATED event (fire and forget)
      const initiatorRole = userId === companyId ? 'Company' : 'Player';

      this.logChatEvent(
        ChatEventType.CHAT_INITIATED,
        chat.id,
        undefined,
        `${initiatorRole} initiated the discussion.`,
        undefined,
        {
          initiatorId: userId,
          recipientId,
          companyId,
          playerId,
        },
      ).catch((error) => {
        this.logger.error(
          `Failed to log chat initiated event: ${error.message}`,
        );
      });

      await this.cache.cacheChat({
        id: chat.id,
        status: chat.status,
        expiresAt: null,
        participantIds: [companyId, playerId],
        companyId,
        playerId,
        initiatorId: userId,
        acceptedAt: null,
      });

      // Increment unread count for recipient
      const recipientUserId = userId === companyId ? playerId : companyId;
      await this.cache.incrementUnreadCount(recipientUserId, chat.id);

      // Build response
      const chatResponse = this.buildChatResponse(
        chat,
        userId,
        companyId,
        recipientUser,
      );

      const initialMsg = chat.messages[0];

      return {
        message: 'Chat created successfully',
        data: {
          chat: chatResponse,
          message: this.formatMessage(initialMsg),
          // Note: HireRequest is being created asynchronously
          // Client can fetch it separately if needed
        },
        recipientView: await this.buildRecipientChatView(
          chat,
          userId,
          userType,
          companyId,
          playerId,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error creating chat for user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to create chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async resendChatRequest(userId: string, dto: { chatId: string }) {
    const { chatId } = dto;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const chat = await tx.chat.findUnique({
          where: { id: chatId },
          select: {
            id: true,
            status: true,
            closedBy: true,
            declinedAt: true,
            participantIds: true,
            companyId: true,
            playerId: true,
            initiatorId: true,
            company: { select: { id: true, name: true } },
            player: { select: { id: true, name: true } },
          },
        });

        if (!chat) {
          throw new BadRequestException({
            message: "Chat doesn't exist",
            errors: [
              {
                field: 'chatId',
                message: 'Chat ID is invalid',
                code: 'CHAT_NOT_FOUND',
              },
            ],
          });
        }

        const participantIds = chat.participantIds as string[];
        if (!participantIds.includes(userId)) {
          throw new ForbiddenException({
            message: 'You are not a participant in this chat',
            errors: [
              { field: 'chatId', message: 'Access denied', code: 'FORBIDDEN' },
            ],
          });
        }

        const recipientId = participantIds.find((id) => id !== userId)!;

        // Allow retrying DECLINED, ENDED, or EXPIRED chats
        if (
          chat.status !== ChatStatus.DECLINED &&
          chat.status !== ChatStatus.ENDED &&
          chat.status !== ChatStatus.EXPIRED
        ) {
          throw new BadRequestException({
            message: 'Only declined, ended, or expired chats can be resent',
            errors: [
              {
                field: 'chatId',
                message: 'Chat must be declined, ended, or expired to resend',
                code: 'INVALID_CHAT_STATE',
              },
            ],
          });
        }

        // Store the original status before updating (already validated to be DECLINED, ENDED, or EXPIRED)
        const originalStatus = chat.status as 'DECLINED' | 'ENDED' | 'EXPIRED';

        // For DECLINED chats, verify it was closed by the recipient
        if (originalStatus === 'DECLINED' && chat.closedBy !== recipientId) {
          throw new BadRequestException({
            message: 'Only declined chats closed by recipient can be resent',
            errors: [
              {
                field: 'chatId',
                message: 'Chat must be declined by recipient to resend',
                code: 'INVALID_CHAT_STATE',
              },
            ],
          });
        }

        if (userId === chat.closedBy) {
          throw new BadRequestException({
            message: 'You cannot resend a chat you declined',
            errors: [
              {
                field: 'userId',
                message: 'Only the original sender can resend',
                code: 'UNAUTHORIZED_RESEND',
              },
            ],
          });
        }

        // Check 24-hour cooldown for declined chats
        if (chat.declinedAt) {
          const hoursSinceDecline =
            (Date.now() - chat.declinedAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceDecline < 24) {
            const hoursRemaining = Math.ceil(24 - hoursSinceDecline);
            throw new BadRequestException({
              message: 'Please wait before resending this chat request',
              errors: [
                {
                  field: 'chatId',
                  message: `You must wait ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} before resending this request`,
                  code: 'COOLDOWN_ACTIVE',
                },
              ],
            });
          }
        }

        const [currentUser, recipientUser] = await this.fetchUsersWithClubData(
          userId,
          recipientId,
        );

        this.validateUsers(currentUser, recipientUser);

        const updatedChat = await tx.chat.update({
          where: { id: chatId },
          data: {
            status: ChatStatus.PENDING,
            closedBy: null,
            declinedAt: null, // Clear declined timestamp for fresh cooldown if declined again
            expiresAt: null,
            lastMessageAt: new Date(),
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            companyId: true,
            playerId: true,
            company: {
              select: {
                id: true,
                name: true,
                userType: true,
                company: { select: { avatar: true, address: true } },
              },
            },
            player: {
              select: {
                id: true,
                name: true,
                userType: true,
                player: { select: { avatar: true, address: true } },
              },
            },
          },
        });

        return { chat: updatedChat, recipientUser, recipientId, originalStatus };
      });

      await this.cache.updateChatStatus(chatId, ChatStatus.PENDING, null, null);

      const recipientUserId =
        userId === result.chat.companyId
          ? result.chat.playerId
          : result.chat.companyId;
      await this.cache.incrementUnreadCount(recipientUserId, chatId);

      // Log appropriate retry event based on original status (fire and forget)
      const resenderName =
        userId === result.chat.companyId
          ? result.chat.company.name
          : result.chat.player.name;

      // Determine the correct event type and message based on original status
      let eventType: ChatEventType;
      let eventMessage: string;

      switch (result.originalStatus) {
        case 'DECLINED':
          eventType = ChatEventType.CHAT_DECLINED_RETRIED;
          eventMessage = `${resenderName} retried a declined chat`;
          break;
        case 'ENDED':
          eventType = ChatEventType.CHAT_ENDED_RETRIED;
          eventMessage = `${resenderName} retried an ended chat`;
          break;
        case 'EXPIRED':
          eventType = ChatEventType.CHAT_EXPIRED_RETRIED;
          eventMessage = `${resenderName} retried an expired chat`;
          break;
        default:
          eventType = ChatEventType.CHAT_RESENT;
          eventMessage = `${resenderName} sent the chat request again`;
      }

      this.logChatEvent(
        eventType,
        chatId,
        undefined,
        eventMessage,
        undefined,
        {
          resentBy: userId,
          recipientId: result.recipientId,
          originalStatus: result.originalStatus,
        },
      ).catch((error) => {
        this.logger.error(`Failed to log chat retry event: ${error.message}`);
      });

      const chatResponse = this.buildChatResponse(
        result.chat,
        userId,
        result.chat.companyId,
        result.recipientUser,
      );

      return {
        message: 'Chat re-requested successfully',
        data: {
          chat: chatResponse,
          originalStatus: result.originalStatus,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error resending chat request for chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to resend chat request due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async retryDeclinedChat(userId: string, dto: { chatId: string }) {
    const { chatId } = dto;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const chat = await tx.chat.findUnique({
          where: { id: chatId },
          select: {
            id: true,
            status: true,
            closedBy: true,
            declinedAt: true,
            participantIds: true,
            companyId: true,
            playerId: true,
            initiatorId: true,
            company: { select: { id: true, name: true } },
            player: { select: { id: true, name: true } },
          },
        });

        if (!chat) {
          throw new BadRequestException({
            message: "Chat doesn't exist",
            errors: [
              {
                field: 'chatId',
                message: 'Chat ID is invalid',
                code: 'CHAT_NOT_FOUND',
              },
            ],
          });
        }

        const participantIds = chat.participantIds as string[];
        if (!participantIds.includes(userId)) {
          throw new ForbiddenException({
            message: 'You are not a participant in this chat',
            errors: [
              { field: 'chatId', message: 'Access denied', code: 'FORBIDDEN' },
            ],
          });
        }

        const recipientId = participantIds.find((id) => id !== userId)!;

        // Only DECLINED chats can be retried with this method
        if (chat.status !== ChatStatus.DECLINED) {
          throw new BadRequestException({
            message: 'Only declined chats can be retried',
            errors: [
              {
                field: 'chatId',
                message: 'Chat must be declined to retry',
                code: 'INVALID_CHAT_STATE',
              },
            ],
          });
        }

        // Verify user didn't decline their own chat (can't retry if you declined)
        if (chat.closedBy === userId) {
          throw new BadRequestException({
            message: 'You cannot retry a chat you declined',
            errors: [
              {
                field: 'userId',
                message: 'Only the other participant can retry a declined chat',
                code: 'CANNOT_RETRY_OWN_DECLINE',
              },
            ],
          });
        }

        // Check 24-hour cooldown for declined chats
        if (chat.declinedAt) {
          const hoursSinceDecline =
            (Date.now() - chat.declinedAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceDecline < 24) {
            const hoursRemaining = Math.ceil(24 - hoursSinceDecline);
            throw new BadRequestException({
              message: 'Please wait before retrying this chat request',
              errors: [
                {
                  field: 'chatId',
                  message: `You must wait ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} before retrying this request`,
                  code: 'COOLDOWN_ACTIVE',
                },
              ],
            });
          }
        }

        const [currentUser, recipientUser] = await this.fetchUsersWithClubData(
          userId,
          recipientId,
        );

        this.validateUsers(currentUser, recipientUser);

        const updatedChat = await tx.chat.update({
          where: { id: chatId },
          data: {
            status: ChatStatus.PENDING,
            initiatorId: userId, // Person who retries becomes the new initiator
            closedBy: null,
            declinedAt: null,
            expiresAt: null,
            extensionCount: 0, // Reset extension count for fresh start
            lastMessageAt: new Date(),
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            companyId: true,
            playerId: true,
            company: {
              select: {
                id: true,
                name: true,
                userType: true,
                company: { select: { avatar: true, address: true } },
              },
            },
            player: {
              select: {
                id: true,
                name: true,
                userType: true,
                player: { select: { avatar: true, address: true } },
              },
            },
          },
        });

        return { chat: updatedChat, recipientUser, recipientId };
      });

      await this.cache.updateChatStatus(chatId, ChatStatus.PENDING, null, null);

      const recipientUserId =
        userId === result.chat.companyId
          ? result.chat.playerId
          : result.chat.companyId;
      await this.cache.incrementUnreadCount(recipientUserId, chatId);

      // Log CHAT_DECLINED_RETRIED event
      const resenderRole =
        userId === result.chat.companyId
          ? 'Company'
          : 'Player';

      this.logChatEvent(
        ChatEventType.CHAT_DECLINED_RETRIED,
        chatId,
        undefined,
        `${resenderRole} restarted the discussion.`,
        undefined,
        {
          retriedBy: userId,
          recipientId: result.recipientId,
        },
      ).catch((error) => {
        this.logger.error(
          `Failed to log declined chat retry event: ${error.message}`,
        );
      });

      const chatResponse = this.buildChatResponse(
        result.chat,
        userId,
        result.chat.companyId,
        result.recipientUser,
      );

      return {
        message: 'Declined chat retried successfully',
        data: {
          chat: chatResponse,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error retrying declined chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to retry declined chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async retryEndedChat(userId: string, dto: { chatId: string }) {
    const { chatId } = dto;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const chat = await tx.chat.findUnique({
          where: { id: chatId },
          select: {
            id: true,
            status: true,
            closedBy: true,
            participantIds: true,
            companyId: true,
            playerId: true,
            initiatorId: true,
            company: { select: { id: true, name: true } },
            player: { select: { id: true, name: true } },
          },
        });

        if (!chat) {
          throw new BadRequestException({
            message: "Chat doesn't exist",
            errors: [
              {
                field: 'chatId',
                message: 'Chat ID is invalid',
                code: 'CHAT_NOT_FOUND',
              },
            ],
          });
        }

        const participantIds = chat.participantIds as string[];
        if (!participantIds.includes(userId)) {
          throw new ForbiddenException({
            message: 'You are not a participant in this chat',
            errors: [
              { field: 'chatId', message: 'Access denied', code: 'FORBIDDEN' },
            ],
          });
        }

        const recipientId = participantIds.find((id) => id !== userId)!;

        // Only ENDED chats can be retried with this method
        if (chat.status !== ChatStatus.ENDED) {
          throw new BadRequestException({
            message: 'Only ended chats can be retried',
            errors: [
              {
                field: 'chatId',
                message: 'Chat must be ended to retry',
                code: 'INVALID_CHAT_STATE',
              },
            ],
          });
        }

        // Verify user didn't end the chat themselves (can't retry if you ended it)
        if (chat.closedBy === userId) {
          throw new BadRequestException({
            message: 'You cannot retry a chat you ended',
            errors: [
              {
                field: 'userId',
                message: 'Only the other participant can retry an ended chat',
                code: 'CANNOT_RETRY_OWN_END',
              },
            ],
          });
        }

        const [currentUser, recipientUser] = await this.fetchUsersWithClubData(
          userId,
          recipientId,
        );

        this.validateUsers(currentUser, recipientUser);

        const updatedChat = await tx.chat.update({
          where: { id: chatId },
          data: {
            status: ChatStatus.PENDING,
            initiatorId: userId, // Person who retries becomes the new initiator
            closedBy: null,
            expiresAt: null,
            extensionCount: 0, // Reset extension count for fresh start
            lastMessageAt: new Date(),
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            companyId: true,
            playerId: true,
            company: {
              select: {
                id: true,
                name: true,
                userType: true,
                company: { select: { avatar: true, address: true } },
              },
            },
            player: {
              select: {
                id: true,
                name: true,
                userType: true,
                player: { select: { avatar: true, address: true } },
              },
            },
          },
        });

        return { chat: updatedChat, recipientUser, recipientId };
      });

      await this.cache.updateChatStatus(chatId, ChatStatus.PENDING, null, null);

      const recipientUserId =
        userId === result.chat.companyId
          ? result.chat.playerId
          : result.chat.companyId;
      await this.cache.incrementUnreadCount(recipientUserId, chatId);

      // Log CHAT_ENDED_RETRIED event
      const resenderRole =
        userId === result.chat.companyId
          ? 'Company'
          : 'Player';

      this.logChatEvent(
        ChatEventType.CHAT_ENDED_RETRIED,
        chatId,
        undefined,
        `${resenderRole} restarted the discussion.`,
        undefined,
        {
          retriedBy: userId,
          recipientId: result.recipientId,
        },
      ).catch((error) => {
        this.logger.error(
          `Failed to log ended chat retry event: ${error.message}`,
        );
      });

      const chatResponse = this.buildChatResponse(
        result.chat,
        userId,
        result.chat.companyId,
        result.recipientUser,
      );

      return {
        message: 'Ended chat retried successfully',
        data: {
          chat: chatResponse,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error retrying ended chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to retry ended chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async retryExpiredChat(userId: string, dto: { chatId: string }) {
    const { chatId } = dto;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const chat = await tx.chat.findUnique({
          where: { id: chatId },
          select: {
            id: true,
            status: true,
            extensionCount: true,
            participantIds: true,
            companyId: true,
            playerId: true,
            initiatorId: true,
            company: { select: { id: true, name: true } },
            player: { select: { id: true, name: true } },
          },
        });

        if (!chat) {
          throw new BadRequestException({
            message: "Chat doesn't exist",
            errors: [
              {
                field: 'chatId',
                message: 'Chat ID is invalid',
                code: 'CHAT_NOT_FOUND',
              },
            ],
          });
        }

        const participantIds = chat.participantIds as string[];
        if (!participantIds.includes(userId)) {
          throw new ForbiddenException({
            message: 'You are not a participant in this chat',
            errors: [
              { field: 'chatId', message: 'Access denied', code: 'FORBIDDEN' },
            ],
          });
        }

        const recipientId = participantIds.find((id) => id !== userId)!;

        // Only EXPIRED chats can be retried with this method
        if (chat.status !== ChatStatus.EXPIRED) {
          throw new BadRequestException({
            message: 'Only expired chats can be retried',
            errors: [
              {
                field: 'chatId',
                message: 'Chat must be expired to retry',
                code: 'INVALID_CHAT_STATE',
              },
            ],
          });
        }

        // Verify all extension grace has been used (extensionCount must be 3)
        if (chat.extensionCount < 3) {
          const remainingExtensions = 3 - chat.extensionCount;
          throw new BadRequestException({
            message: 'Chat still has extension opportunities',
            errors: [
              {
                field: 'chatId',
                message: `You still have ${remainingExtensions} extension${remainingExtensions > 1 ? 's' : ''} remaining. Use extend instead of retry.`,
                code: 'EXTENSIONS_AVAILABLE',
              },
            ],
          });
        }

        const [currentUser, recipientUser] = await this.fetchUsersWithClubData(
          userId,
          recipientId,
        );

        this.validateUsers(currentUser, recipientUser);

        const updatedChat = await tx.chat.update({
          where: { id: chatId },
          data: {
            status: ChatStatus.PENDING,
            initiatorId: userId, // Person who retries becomes the new initiator
            closedBy: null,
            expiresAt: null,
            extensionCount: 0, // Reset extension count for fresh start
            lastMessageAt: new Date(),
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            companyId: true,
            playerId: true,
            company: {
              select: {
                id: true,
                name: true,
                userType: true,
                company: { select: { avatar: true, address: true } },
              },
            },
            player: {
              select: {
                id: true,
                name: true,
                userType: true,
                player: { select: { avatar: true, address: true } },
              },
            },
          },
        });

        return { chat: updatedChat, recipientUser, recipientId };
      });

      await this.cache.updateChatStatus(chatId, ChatStatus.PENDING, null, null);

      const recipientUserId =
        userId === result.chat.companyId
          ? result.chat.playerId
          : result.chat.companyId;
      await this.cache.incrementUnreadCount(recipientUserId, chatId);

      // Log CHAT_EXPIRED_RETRIED event
      const resenderRole =
        userId === result.chat.companyId
          ? 'Company'
          : 'Player';

      this.logChatEvent(
        ChatEventType.CHAT_EXPIRED_RETRIED,
        chatId,
        undefined,
        `${resenderRole} restarted the discussion.`,
        undefined,
        {
          retriedBy: userId,
          recipientId: result.recipientId,
        },
      ).catch((error) => {
        this.logger.error(
          `Failed to log expired chat retry event: ${error.message}`,
        );
      });

      const chatResponse = this.buildChatResponse(
        result.chat,
        userId,
        result.chat.companyId,
        result.recipientUser,
      );

      return {
        message: 'Expired chat retried successfully',
        data: {
          chat: chatResponse,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error retrying expired chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to retry expired chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async acceptChat(chatId: string, userId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          status: true,
          initiatorId: true,
          participantIds: true,
          companyId: true,
          playerId: true,
          company: { select: { name: true } },
          player: { select: { name: true } },
        },
      });

      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const participantIds = chat.participantIds as string[];
      if (!participantIds.includes(userId)) {
        throw new ForbiddenException({
          message: 'Not a participant in this chat',
          errors: [
            {
              field: 'chatId',
              message: 'You are not authorized to accept this chat',
              code: 'NOT_PARTICIPANT',
            },
          ],
        });
      }

      // Only the recipient (not the initiator) can accept the chat
      if (userId === chat.initiatorId) {
        throw new ForbiddenException({
          message: 'Cannot accept your own chat request',
          errors: [
            {
              field: 'userId',
              message:
                'Only the person who received the chat request can accept it',
              code: 'CANNOT_ACCEPT_OWN_REQUEST',
            },
          ],
        });
      }

      if (chat.status !== ChatStatus.PENDING) {
        throw new BadRequestException({
          message: 'Chat is not pending',
          errors: [
            {
              field: 'status',
              message: `Chat is already ${chat.status.toLowerCase()}`,
              code: 'INVALID_STATUS',
            },
          ],
        });
      }

      const acceptedAt = new Date();
      const expiresAt = new Date(acceptedAt);
      expiresAt.setDate(expiresAt.getDate() + this.CHAT_DURATION_DAYS);

      // Update ONLY chat status (fast, no blocking operations)
      const updated = await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          status: ChatStatus.ACCEPTED,
          acceptedAt,
          expiresAt,
        },
        select: {
          id: true,
          status: true,
          acceptedAt: true,
          expiresAt: true,
        },
      });

      // Log CHAT_ACCEPTED event (fire and forget)
      const acceptorRole =
        userId === chat.companyId ? 'Company' : 'Player';

      this.logChatEvent(
        ChatEventType.CHAT_ACCEPTED,
        chatId,
        undefined,
        `Discussion accepted by ${acceptorRole}.`,
        undefined,
        {
          acceptedBy: userId,
          acceptedAt: acceptedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      ).catch((error) => {
        this.logger.error(
          `Failed to log chat accepted event: ${error.message}`,
        );
      });

      // Update HireRequest status asynchronously (non-blocking, fire and forget)
      this.updateHireRequestStatusAsync(
        chatId,
        RequestStatus.ACCEPTED,
        ChatEventType.HIRE_REQUEST_ACCEPTED,
        userId,
      ).catch((error) => {
        this.logger.error(`Async HireRequest update failed: ${error.message}`);
      });

      // Update cache and invalidate metadata
      await this.cache.updateChatStatus(
        chatId,
        ChatStatus.ACCEPTED,
        expiresAt,
        acceptedAt,
      );
      await this.cache.invalidateChatMetadata(chatId);

      // Schedule expiration job
      const delay = expiresAt.getTime() - Date.now();
      await this.expiryQueue.add(
        'expire-chat',
        { chatId },
        {
          delay,
          jobId: `chat-expiry-${chatId}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return {
        message: 'Chat accepted successfully',
        data: {
          status: updated.status as 'ACCEPTED',
          expiresAt: updated.expiresAt!.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error accepting chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to accept chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async declineChat(chatId: string, userId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          status: true,
          initiatorId: true,
          participantIds: true,
          companyId: true,
          playerId: true,
          company: { select: { name: true } },
          player: { select: { name: true } },
        },
      });

      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const participantIds = chat.participantIds as string[];
      if (!participantIds.includes(userId)) {
        throw new ForbiddenException({
          message: 'Not a participant in this chat',
          errors: [
            {
              field: 'chatId',
              message: 'You are not authorized to decline this chat',
              code: 'NOT_PARTICIPANT',
            },
          ],
        });
      }

      // Only the recipient (not the initiator) can decline the chat
      if (userId === chat.initiatorId) {
        throw new ForbiddenException({
          message: 'Cannot decline your own chat request',
          errors: [
            {
              field: 'userId',
              message:
                'Only the person who received the chat request can decline it',
              code: 'CANNOT_DECLINE_OWN_REQUEST',
            },
          ],
        });
      }

      if (chat.status !== ChatStatus.PENDING) {
        throw new BadRequestException({
          message: 'Only pending chats can be declined',
          errors: [
            {
              field: 'status',
              message: `Chat is already ${chat.status.toLowerCase()}`,
              code: 'INVALID_STATUS',
            },
          ],
        });
      }

      // Update ONLY chat status (fast, no blocking operations)
      const updated = await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          status: ChatStatus.DECLINED,
          closedBy: userId,
          declinedAt: new Date(), // Track decline timestamp for 24hr cooldown
        },
        select: {
          id: true,
          status: true,
        },
      });

      // Log CHAT_DECLINED event (fire and forget)
      const declinerRole =
        userId === chat.companyId ? 'Company' : 'Player';

      this.logChatEvent(
        ChatEventType.CHAT_DECLINED,
        chatId,
        undefined,
        `Discussion rejected by ${declinerRole}.`,
        undefined,
        {
          declinedBy: userId,
        },
      ).catch((error) => {
        this.logger.error(
          `Failed to log chat declined event: ${error.message}`,
        );
      });

      // Update HireRequest status asynchronously (non-blocking, fire and forget)
      this.updateHireRequestStatusAsync(
        chatId,
        RequestStatus.DECLINED,
        ChatEventType.HIRE_REQUEST_DECLINED,
        userId,
      ).catch((error) => {
        this.logger.error(`Async HireRequest update failed: ${error.message}`);
      });

      await this.cache.updateChatStatus(chatId, ChatStatus.DECLINED);
      await this.cache.invalidateChatMetadata(chatId);

      // Remove expiration job if it exists (in case chat was accepted then declined via resend)
      const existingJob = await this.expiryQueue.getJob(
        `chat-expiry-${chatId}`,
      );
      if (existingJob) {
        await existingJob.remove();
      }

      return {
        message: 'Chat declined successfully',
        data: {
          status: updated.status as 'DECLINED',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error declining chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to decline chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async extendChat(chatId: string, userId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          status: true,
          initiatorId: true,
          participantIds: true,
          expiresAt: true,
          extensionCount: true,
          companyId: true,
          playerId: true,
          company: { select: { name: true } },
          player: { select: { name: true } },
        },
      });

      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const participantIds = chat.participantIds as string[];
      if (!participantIds.includes(userId)) {
        throw new ForbiddenException({
          message: 'Not a participant in this chat',
          errors: [
            {
              field: 'chatId',
              message: 'You are not authorized to extend this chat',
              code: 'NOT_PARTICIPANT',
            },
          ],
        });
      }

      // Only the initiator can extend the chat
      if (userId !== chat.initiatorId) {
        throw new ForbiddenException({
          message: 'Only the chat initiator can extend the chat',
          errors: [
            {
              field: 'userId',
              message: 'Only the person who initiated this chat can extend it',
              code: 'NOT_INITIATOR',
            },
          ],
        });
      }

      if (chat.status !== ChatStatus.ACCEPTED) {
        throw new BadRequestException({
          message: 'Only accepted chats can be extended',
          errors: [
            {
              field: 'status',
              message: `Chat is ${chat.status.toLowerCase()}`,
              code: 'INVALID_STATUS',
            },
          ],
        });
      }

      if (!chat.expiresAt) {
        throw new BadRequestException({
          message: 'Chat has no expiry date',
          errors: [
            {
              field: 'expiresAt',
              message: 'Cannot extend chat without expiry',
              code: 'NO_EXPIRY',
            },
          ],
        });
      }

      const daysToAdd = this.getExtensionDuration(chat.extensionCount);

      if (daysToAdd === 0) {
        throw new BadRequestException({
          message: 'Maximum extensions reached',
          errors: [
            {
              field: 'extensionCount',
              message:
                'This chat has reached the maximum number of extensions (3)',
              code: 'MAX_EXTENSIONS_REACHED',
            },
          ],
        });
      }

      const newExpiresAt = new Date(chat.expiresAt);
      newExpiresAt.setDate(newExpiresAt.getDate() + daysToAdd);

      const updated = await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          expiresAt: newExpiresAt,
          extensionCount: { increment: 1 },
        },
        select: {
          id: true,
          expiresAt: true,
          extensionCount: true,
        },
      });

      // Map days to enum
      const extensionDaysEnum =
        daysToAdd === 14
          ? RequestExtendEventDays.DAYS_14
          : daysToAdd === 7
            ? RequestExtendEventDays.DAYS_7
            : RequestExtendEventDays.DAYS_3;

      // Log CHAT_EXTENDED event
      const extenderRole =
        userId === chat.companyId ? 'Company' : 'Player';

      await this.logChatEvent(
        ChatEventType.CHAT_EXTENDED,
        chatId,
        undefined,
        `${extenderRole} initiated an extra ${daysToAdd} ${daysToAdd === 1 ? 'day' : 'days'} grace period.`,
        extensionDaysEnum,
        {
          extendedBy: userId,
          daysAdded: daysToAdd,
          newExpiresAt: newExpiresAt.toISOString(),
          extensionCount: updated.extensionCount,
        },
      );

      await this.cache.updateChatStatus(
        chatId,
        ChatStatus.ACCEPTED,
        newExpiresAt,
      );

      // Notify participants via WebSocket
      await this.gateway.notifyChatExtended(chatId);

      // Reschedule expiration job with new time
      const jobId = `chat-expiry-${chatId}`;
      const existingJob = await this.expiryQueue.getJob(jobId);
      if (existingJob) {
        await existingJob.remove();
      }

      const delay = newExpiresAt.getTime() - Date.now();
      await this.expiryQueue.add(
        'expire-chat',
        { chatId },
        {
          delay,
          jobId,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return {
        message: `Chat extended by ${daysToAdd} days`,
        data: {
          expiresAt: updated.expiresAt!.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error extending chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to extend chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  /**
   * Get the count of unattended chat items (pending requests where user is the recipient)
   */
  async getUnattendedCount(userId: string) {
    try {
      const count = await this.prisma.chat.count({
        where: {
          OR: [{ companyId: userId }, { playerId: userId }],
          status: ChatStatus.PENDING,
          initiatorId: { not: userId }, // User is the recipient, not the initiator
        },
      });

      return {
        message: 'Successfully fetched the unattended count',
        data: count 
      };
    } catch (error) {
      this.logger.error(
        `Error getting unattended count for user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );
      return 0; // Return 0 on error to avoid breaking the UI
    }
  }

  async getChats(
    userId: string,
    status?: 'READ' | 'UNREAD',
    search?: string,
    page = 1,
    limit = 20,
  ) {
    try {
      const { take, skip } = createPaginationParams(page, limit);

      const where: any = {
        OR: [{ companyId: userId }, { playerId: userId }],
      };

      // Filter by search (participant name)
      if (search) {
        where.OR = [
          {
            companyId: userId,
            player: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            playerId: userId,
            company: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        ];
      }

      const [chats, total, unreadCounts, deletedChats] = await Promise.all([
        this.prisma.chat.findMany({
          where,
          skip,
          take,
          orderBy: { lastMessageAt: 'desc' },
          select: {
            id: true,
            status: true,
            companyId: true,
            closedBy: true,
            lastMessageAt: true,
            expiresAt: true,
            createdAt: true,
            company: {
              select: {
                id: true,
                name: true,
                userType: true,
                company: { select: { avatar: true } },
              },
            },
            player: {
              select: {
                id: true,
                name: true,
                userType: true,
                player: { select: { avatar: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                content: true,
                attachments: true,
                senderId: true,
                createdAt: true,
              },
            },
          },
        }),
        this.prisma.chat.count({ where }),
        this.cache.getAllUnreadCounts(userId),
        this.cache.getDeletedChats(userId),
      ]);

      const deletedSet = new Set(deletedChats);
      const filteredChats = chats.filter((chat) => !deletedSet.has(chat.id));

      // Format chats to match frontend Message type
      const formattedChats = filteredChats
        .map((chat) => {
          const isUserCompany = userId === chat.company.id;
          const otherParticipant = isUserCompany ? chat.player : chat.company;
          const otherParticipantAvatar = isUserCompany
            ? chat.player.player?.avatar
            : chat.company.company?.avatar;

          const unreadCount = unreadCounts[chat.id] || 0;
          const isUnread = unreadCount > 0;

          // Get last message preview
          const lastMessage = chat.messages[0];
          let messagePreview = '';

          if (lastMessage) {
            if (lastMessage.content) {
              // Has text content
              messagePreview = lastMessage.content;
            } else if (
              lastMessage.attachments &&
              Array.isArray(lastMessage.attachments)
            ) {
              // Attachment-only message
              const attachmentCount = lastMessage.attachments.length;
              messagePreview =
                attachmentCount === 1
                  ? '📎 Sent an attachment'
                  : `📎 Sent ${attachmentCount} attachments`;
            }
          }

          // Format according to frontend Message type
          const formattedChat: any = {
            id: chat.id,
            name: otherParticipant.name,
            avatar: otherParticipantAvatar,
            message: messagePreview,
            timestamp:
              chat.lastMessageAt?.toISOString() || new Date().toISOString(),
            status: isUnread ? 'UNREAD' : 'READ',
          };

          // Add unreadCount only for unread messages
          if (isUnread) {
            formattedChat.unreadCount = unreadCount;
          } else {
            formattedChat.unreadCount = 0;
          }

          return formattedChat;
        })
        .filter((chat) => {
          if (!status) return true;
          return chat.status === status;
        });

      // Recalculate total after read/unread filtering
      const filteredTotal =
        status !== undefined ? formattedChats.length : total;

      return {
        message: 'Chats retrieved successfully',
        data: {
          data: formattedChats,
          ...createPaginationMeta(filteredTotal, page, limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error retrieving chats for user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to retrieve chats due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  /**
   * Calculate when a declined chat can be retried (24hr cooldown)
   * Returns ISO string if within cooldown, undefined if can retry now
   */
  private calculateCanRetryAt(declinedAt: Date | null): string | undefined {
    if (!declinedAt) return undefined;

    const hoursSinceDecline = (Date.now() - declinedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceDecline < 24) {
      const canRetryDate = new Date(declinedAt.getTime() + 24 * 60 * 60 * 1000);
      return canRetryDate.toISOString();
    }

    return undefined;
  }

  async getChatById(chatId: string, userId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          status: true,
          companyId: true,
          playerId: true,
          closedBy: true,
          expiresAt: true,
          participantIds: true,
          initiatorId: true,
          extensionCount: true,
          declinedAt: true,
          company: {
            select: {
              id: true,
              name: true,
              userType: true,
              company: {
                select: {
                  id: true,
                  avatar: true,
                  address: true,
                },
              },
              affiliates: {
                where: {
                  type: UserType.COMPANY,
                  isApproved: true,
                },
                select: {
                  club: {
                    select: {
                      id: true,
                      user: { select: { name: true } },
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          player: {
            select: {
              id: true,
              name: true,
              userType: true,
              player: {
                select: {
                  id: true,
                  avatar: true,
                  address: true,
                  club: {
                    select: {
                      id: true,
                      user: { select: { name: true } },
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const participantIds = chat.participantIds as string[];
      if (!participantIds.includes(userId)) {
        throw new ForbiddenException({
          message: 'Not a participant in this chat',
          errors: [
            {
              field: 'chatId',
              message: 'You are not authorized to view this chat',
              code: 'NOT_PARTICIPANT',
            },
          ],
        });
      }

      // Determine who the recipient is (the other participant)
      const isUserCompany = userId === chat.companyId;
      const recipientUser = isUserCompany ? chat.player : chat.company;
      const recipientProfile = isUserCompany
        ? chat.player.player
        : chat.company.company;

      // Calculate initiatedBy: company always initiates
      const initiatedBy = chat.initiatorId === userId ? 'ME' : 'THEM';

      // Build recipient object
      const recipient: any = {
        id: recipientUser.id,
        profileId: recipientProfile?.id,
        name: recipientUser.name,
        userType: recipientUser.userType.toLowerCase(),
        avatar: recipientProfile?.avatar,
        location: recipientProfile?.address,
        club: (() => {
          // For players/supporters, get their direct club
          if (isUserCompany && chat.player.player?.club) {
            return {
              id: chat.player.player.club.id,
              name: chat.player.player.club.user.name,
              avatar: chat.player.player.club.avatar || undefined,
            };
          }
          // For companies, get their affiliate club
          if (!isUserCompany && chat.company.affiliates?.[0]?.club) {
            const affiliateClub = chat.company.affiliates[0].club;
            return {
              id: affiliateClub.id,
              name: affiliateClub.user.name,
              avatar: affiliateClub.avatar || undefined,
            };
          }
          // Fallback
          return {
            id: 'no-club',
            name: 'No Club',
            avatar: undefined,
          };
        })(),
      };

      // Build response based on status (matching frontend ChatDetails union type)
      const baseResponse: any = {
        id: chat.id,
        status: chat.status,
        initiatedBy,
        recipient,
      };

      // Add status-specific fields to match the union type exactly
      if (chat.status === ChatStatus.PENDING) {
        // PendingChat: no expiresAt, no closedBy
        return {
          message: 'Chat retrieved successfully',
          data: baseResponse,
        };
      } else if (chat.status === ChatStatus.ACCEPTED) {
        // AcceptedChat: expiresAt and remainingExtensions required, no closedBy
        const remainingExtensions = Math.max(0, 3 - (chat.extensionCount || 0));
        return {
          message: 'Chat retrieved successfully',
          data: {
            ...baseResponse,
            expiresAt: chat.expiresAt?.toISOString() || null,
            remainingExtensions,
          },
        };
      } else if (chat.status === ChatStatus.DECLINED) {
        // DeclinedChat: closedBy required, canRetryAt if declined within 24hrs
        const closedBy = chat.closedBy === userId ? 'ME' : 'THEM';
        const canRetryAt = this.calculateCanRetryAt(chat.declinedAt);
        return {
          message: 'Chat retrieved successfully',
          data: {
            ...baseResponse,
            closedBy,
            ...(canRetryAt && { canRetryAt }),
          },
        };
      } else if (chat.status === ChatStatus.ENDED) {
        // EndedChat: closedBy required, no canRetryAt (can always retry ended chats)
        const closedBy = chat.closedBy === userId ? 'ME' : 'THEM';
        return {
          message: 'Chat retrieved successfully',
          data: {
            ...baseResponse,
            closedBy,
          },
        };
      } else if (chat.status === ChatStatus.EXPIRED) {
        // ExpiredChat: closedBy is "EXPIRATION", remainingExtensions or canRetryAt
        const remainingExtensions = Math.max(0, 3 - (chat.extensionCount || 0));
        return {
          message: 'Chat retrieved successfully',
          data: {
            ...baseResponse,
            closedBy: 'EXPIRATION',
            remainingExtensions,
          },
        };
      }

      // Fallback (shouldn't reach here)
      return {
        message: 'Chat retrieved successfully',
        data: baseResponse,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error retrieving chat ${chatId} for user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to retrieve chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  /**
   * Lightweight chat access verification for WebSocket operations
   * Uses cache to minimize database load - only queries DB on cache miss
   * Use this instead of getChatById() when you only need to verify access
   */
  async verifyChatAccess(chatId: string, userId: string): Promise<void> {
    try {
      // Try cache first
      const cachedResult = await this.cache.isParticipantCached(chatId, userId);
      if (cachedResult !== null) {
        // Cache hit
        if (!cachedResult) {
          throw new ForbiddenException({
            message: 'Not a participant in this chat',
            errors: [
              {
                field: 'chatId',
                message: 'You are not authorized to access this chat',
                code: 'NOT_PARTICIPANT',
              },
            ],
          });
        }
        return; // User is verified participant
      }

      // Cache miss - query database
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          participantIds: true,
          status: true,
          companyId: true,
          playerId: true,
        },
      });

      if (!chat) {
        // Cache the negative result
        await this.cache.cacheParticipantVerification(chatId, userId, false);

        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const participantIds = chat.participantIds as string[];
      const isParticipant = participantIds.includes(userId);

      // Cache the result for future requests
      await this.cache.cacheParticipantVerification(
        chatId,
        userId,
        isParticipant,
      );

      // Also cache metadata for other operations
      await this.cache.cacheChatMetadata(chatId, {
        participantIds,
        status: chat.status,
        companyId: chat.companyId,
        playerId: chat.playerId,
      });

      if (!isParticipant) {
        throw new ForbiddenException({
          message: 'Not a participant in this chat',
          errors: [
            {
              field: 'chatId',
              message: 'You are not authorized to access this chat',
              code: 'NOT_PARTICIPANT',
            },
          ],
        });
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error verifying chat access for chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to verify chat access due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async getMessages(chatId: string, userId: string, page = 1, limit = 50) {
    try {
      // Use lightweight verification instead of fetching full chat details
      await this.verifyChatAccess(chatId, userId);

      const skip = (page - 1) * limit;

      const deletedAt = await this.cache.getDeletedAt(userId, chatId);

      const where: any = { chatId };

      if (deletedAt) {
        where.createdAt = { gt: new Date(deletedAt) };
      }

      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            senderId: true,
            content: true,
            attachments: true,
            deliveredAt: true,
            readAt: true,
            createdAt: true,
          },
        }),
        this.prisma.message.count({ where }),
      ]);

      const formattedMessages = messages.map((msg) => {
        const isMyMessage = msg.senderId === userId;

        // Determine status based on message state
        // MY messages: SENT | DELIVERED | READ
        // THEIR messages: DELIVERED | READ (always at least DELIVERED since I received them)
        let status: 'SENT' | 'DELIVERED' | 'READ';
        if (msg.readAt) {
          status = 'READ';
        } else if (msg.deliveredAt) {
          status = 'DELIVERED';
        } else {
          // For MY messages that haven't been delivered yet: SENT
          // For THEIR messages: Default to DELIVERED (if I'm fetching them, they were delivered to me)
          status = isMyMessage ? 'SENT' : 'DELIVERED';
        }

        // Build the base message
        const baseMessage: any = {
          id: msg.id,
          timestamp: msg.createdAt.toISOString(),
          from: isMyMessage ? 'ME' : 'THEM',
          status, // Status is always included for both ME and THEM messages
        };

        // Add content and/or attachments (handle union type)
        if (msg.content) {
          baseMessage.content = msg.content;
        }
        if (
          msg.attachments &&
          Array.isArray(msg.attachments) &&
          msg.attachments.length > 0
        ) {
          baseMessage.attachments = msg.attachments;
        }

        return baseMessage;
      });

      return {
        message: 'Messages retrieved successfully',
        data: {
          data: formattedMessages,
          ...createPaginationMeta(total, page, limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error retrieving messages for chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to retrieve messages due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async validateMessageSend(chatId: string, userId: string) {
    let chat = await this.cache.getCachedChat(chatId);

    if (!chat) {
      const dbChat = await this.prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (!dbChat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      chat = {
        id: dbChat.id,
        status: dbChat.status,
        expiresAt: dbChat.expiresAt?.toISOString() || null,
        participantIds: dbChat.participantIds as string[],
        companyId: dbChat.companyId,
        playerId: dbChat.playerId,
        initiatorId: dbChat.initiatorId,
        acceptedAt: dbChat.acceptedAt?.toISOString() || null,
      };

      await this.cache.cacheChat(chat);
    }

    if (!chat.participantIds.includes(userId)) {
      throw new ForbiddenException({
        message: 'Not a participant in this chat',
        errors: [
          {
            field: 'chatId',
            message: 'You are not authorized to send messages in this chat',
            code: 'NOT_PARTICIPANT',
          },
        ],
      });
    }

    if (chat.status === ChatStatus.PENDING) {
      const messageCount = await this.prisma.message.count({
        where: { chatId },
      });

      if (messageCount >= 1) {
        throw new BadRequestException({
          message: 'Pending chats are limited to 1 message',
          errors: [
            {
              field: 'status',
              message: 'Please wait for the recipient to accept the chat',
              code: 'PENDING_MESSAGE_LIMIT',
            },
          ],
        });
      }
    }

    if (chat.status === ChatStatus.DECLINED) {
      throw new BadRequestException({
        message: 'Chat has been declined',
        errors: [
          {
            field: 'status',
            message: 'Cannot send messages in a declined chat',
            code: 'CHAT_DECLINED',
          },
        ],
      });
    }

    if (chat.status === ChatStatus.EXPIRED) {
      throw new BadRequestException({
        message: 'Chat has expired',
        errors: [
          {
            field: 'status',
            message: 'Please extend the chat to continue messaging',
            code: 'CHAT_EXPIRED',
          },
        ],
      });
    }

    if (chat.status === ChatStatus.ENDED) {
      throw new BadRequestException({
        message: 'Chat has been ended',
        errors: [
          {
            field: 'status',
            message: 'Cannot send messages in an ended chat',
            code: 'CHAT_ENDED',
          },
        ],
      });
    }

    if (chat.status === ChatStatus.ACCEPTED && chat.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(chat.expiresAt);

      if (now > expiryDate) {
        await this.prisma.chat.update({
          where: { id: chatId },
          data: { status: ChatStatus.EXPIRED },
        });

        await this.cache.updateChatStatus(chatId, ChatStatus.EXPIRED);

        throw new BadRequestException({
          message: 'Chat has expired',
          errors: [
            {
              field: 'status',
              message: 'Please extend the chat to continue messaging',
              code: 'CHAT_EXPIRED',
            },
          ],
        });
      }
    }
  }

  async validateMessageOwnership(
    messageId: string,
    chatId: string,
    userId: string,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        chatId: true,
        senderId: true,
      },
    });

    if (!message) {
      throw new NotFoundException({
        message: 'Message not found',
        errors: [
          {
            field: 'messageId',
            message: 'Message does not exist',
            code: 'MESSAGE_NOT_FOUND',
          },
        ],
      });
    }

    if (message.chatId !== chatId) {
      throw new BadRequestException({
        message: 'Message does not belong to this chat',
        errors: [
          {
            field: 'messageId',
            message: 'Message ID does not match the chat',
            code: 'MESSAGE_CHAT_MISMATCH',
          },
        ],
      });
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException({
        message: 'Not authorized to modify this message',
        errors: [
          {
            field: 'messageId',
            message: 'You can only modify messages you sent',
            code: 'NOT_MESSAGE_OWNER',
          },
        ],
      });
    }
  }

  async sendMessage(
    chatId: string,
    userId: string,
    messageData: {
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
    try {
      const { content, attachments } = messageData;

      if (
        (!content || content.trim().length === 0) &&
        (!attachments || attachments.length === 0)
      ) {
        throw new BadRequestException({
          message: 'Message must have either content or attachments',
          errors: [
            {
              field: 'message',
              message: 'Provide either content or attachments',
              code: 'MISSING_CONTENT',
            },
          ],
        });
      }

      if (content && content.length > 1000) {
        throw new BadRequestException({
          message: 'Message content cannot exceed 1000 characters',
          errors: [
            {
              field: 'content',
              message: 'Content too long',
              code: 'CONTENT_TOO_LONG',
            },
          ],
        });
      }

      if (attachments && attachments.length > 10) {
        throw new BadRequestException({
          message: 'Cannot send more than 10 attachments per message',
          errors: [
            {
              field: 'attachments',
              message: 'Too many attachments',
              code: 'TOO_MANY_ATTACHMENTS',
            },
          ],
        });
      }

      const isWithinRateLimit = await this.cache.checkRateLimit(userId, 10, 10);
      if (!isWithinRateLimit) {
        throw new BadRequestException({
          message: 'Rate limit exceeded. Please slow down.',
          errors: [
            {
              field: 'rate',
              message: 'Too many messages sent',
              code: 'RATE_LIMIT_EXCEEDED',
            },
          ],
        });
      }

      await this.validateMessageSend(chatId, userId);

      // Generate a real MongoDB ObjectId upfront for immediate use
      const realMessageId = new ObjectId().toHexString();
      const timestamp = new Date();

      const newMessageData = {
        id: realMessageId,
        chatId: chatId,
        senderId: userId,
        content: content ? content.trim() : null,
        attachments: attachments || null,
        createdAt: timestamp.toISOString(),
      };

      await this.cache.addMessageToCache(chatId, newMessageData);

      const chat = await this.cache.getCachedChat(chatId);
      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found in cache',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const recipientId = chat.participantIds.find((id) => id !== userId);

      if (recipientId) {
        const deletedAt = await this.cache.getDeletedAt(recipientId, chatId);
        if (deletedAt) {
          await this.restoreChat(chatId, recipientId);
        }
      }

      return {
        message: 'Message sent successfully',
        data: {
          messageId: realMessageId,
          chatId,
          timestamp: timestamp.toISOString(),
          messageData: newMessageData,
          participantIds: chat.participantIds,
          recipientId,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error sending message in chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to send message due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async updateMessage(
    chatId: string,
    userId: string,
    messageId: string,
    updates: {
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
    try {
      if (updates.content === undefined && updates.attachments === undefined) {
        throw new BadRequestException({
          message: 'Must provide at least content or attachments to update',
          errors: [
            {
              field: 'updates',
              message: 'No updates provided',
              code: 'NO_UPDATES',
            },
          ],
        });
      }

      if (updates.content !== undefined && updates.content.length > 1000) {
        throw new BadRequestException({
          message: 'Message content cannot exceed 1000 characters',
          errors: [
            {
              field: 'content',
              message: 'Content too long',
              code: 'CONTENT_TOO_LONG',
            },
          ],
        });
      }

      if (
        updates.attachments !== undefined &&
        updates.attachments.length > 10
      ) {
        throw new BadRequestException({
          message: 'Cannot have more than 10 attachments per message',
          errors: [
            {
              field: 'attachments',
              message: 'Too many attachments',
              code: 'TOO_MANY_ATTACHMENTS',
            },
          ],
        });
      }

      await this.validateMessageSend(chatId, userId);

      await this.validateMessageOwnership(messageId, chatId, userId);

      const timestamp = new Date();
      const updatePayload: any = {
        id: messageId,
      };

      if (updates.content !== undefined) {
        updatePayload.content = updates.content.trim() || undefined;
      }

      if (updates.attachments !== undefined) {
        updatePayload.attachments = updates.attachments;
      }

      // Update cache
      await this.cache.updateMessageInCache(chatId, messageId, {
        content: updatePayload.content,
        attachments: updatePayload.attachments,
      });

      return {
        message: 'Message updated successfully',
        data: {
          messageId,
          chatId,
          updatePayload,
          timestamp: timestamp.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error updating message ${messageId} in chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to update message due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async endChat(chatId: string, userId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          status: true,
          participantIds: true,
          companyId: true,
          playerId: true,
          company: { select: { name: true, email: true } },
          player: { select: { name: true, email: true } },
        },
      });

      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const participantIds = chat.participantIds as string[];
      if (!participantIds.includes(userId)) {
        throw new ForbiddenException({
          message: 'Not a participant in this chat',
          errors: [
            {
              field: 'chatId',
              message: 'You are not authorized to end this chat',
              code: 'NOT_PARTICIPANT',
            },
          ],
        });
      }

      if (chat.status !== ChatStatus.ACCEPTED) {
        throw new BadRequestException({
          message: 'Only accepted chats can be ended',
          errors: [
            {
              field: 'status',
              message: `Cannot end a chat that is ${chat.status.toLowerCase()}`,
              code: 'INVALID_STATUS',
            },
          ],
        });
      }

      // Update ONLY chat status (fast, no blocking operations)
      const updated = await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          status: ChatStatus.ENDED,
          closedBy: userId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      // Log CHAT_ENDED event (fire and forget)
      const enderRole =
        userId === chat.companyId ? 'Company' : 'Player';

      this.logChatEvent(
        ChatEventType.CHAT_ENDED,
        chatId,
        undefined,
        `Conversation cancelled by ${enderRole}.`,
        undefined,
        {
          endedBy: userId,
        },
      ).catch((error) => {
        this.logger.error(`Failed to log chat ended event: ${error.message}`);
      });

      // Update HireRequest status asynchronously (non-blocking, fire and forget)
      this.updateHireRequestStatusAsync(
        chatId,
        RequestStatus.ENDED,
        ChatEventType.HIRE_REQUEST_ENDED,
        userId,
      ).catch((error) => {
        this.logger.error(`Async HireRequest update failed: ${error.message}`);
      });

      // Send player chat inquiry email (fire and forget)
      this.gateway.emailService
        .sendPlayerChatInquiryEmail(
          chat.player.email,
          chat.player.name || 'Player',
          chat.company.name || 'Company',
          chat.company.email,
          chatId,
        )
        .catch((error) => {
          this.logger.error(
            `Failed to send chat inquiry email to ${chat.player.email}: ${error.message}`,
          );
        });

      await this.cache.updateChatStatus(chatId, ChatStatus.ENDED);
      await this.cache.invalidateChatMetadata(chatId);

      // Remove expiration job since chat is ended
      const existingJob = await this.expiryQueue.getJob(
        `chat-expiry-${chatId}`,
      );
      if (existingJob) {
        await existingJob.remove();
      }

      return {
        message: 'Chat ended successfully',
        data: {
          status: updated.status as 'ENDED',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error ending chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to end chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async confirmHireStatus(data: {
    hired: boolean;
    userEmail: string;
    companyEmail: string;
    chatId: string;
    token: string;
  }) {
    const { hired, userEmail, companyEmail, chatId, token } = data;

    try {
      // Verify and decode JWT token
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      // Validate token type
      if (payload.type !== 'hire-confirmation') {
        throw new BadRequestException({
          message: 'Invalid token type',
          errors: [
            {
              field: 'token',
              message: 'This token is not valid for hire confirmation',
              code: 'INVALID_TOKEN_TYPE',
            },
          ],
        });
      }

      // Validate token payload matches request data
      if (
        payload.chatId !== chatId ||
        payload.playerEmail !== userEmail ||
        payload.companyEmail !== companyEmail
      ) {
        throw new ForbiddenException({
          message: 'Token data does not match request',
          errors: [
            {
              field: 'token',
              message: 'The confirmation link is not valid for this request',
              code: 'TOKEN_MISMATCH',
            },
          ],
        });
      }

      // Fetch chat to verify participants
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          status: true,
          companyId: true,
          playerId: true,
          company: { select: { email: true, name: true } },
          player: { select: { email: true, name: true } },
        },
      });

      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'The specified chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      // Verify emails match chat participants
      if (
        chat.player.email !== userEmail ||
        chat.company.email !== companyEmail
      ) {
        throw new ForbiddenException({
          message: 'Email addresses do not match chat participants',
          errors: [
            {
              field: 'emails',
              message: 'The provided emails do not match this chat',
              code: 'EMAIL_MISMATCH',
            },
          ],
        });
      }

      // Verify chat is in a terminal state (ENDED or EXPIRED)
      if (chat.status !== ChatStatus.ENDED && chat.status !== ChatStatus.EXPIRED) {
        throw new BadRequestException({
          message: 'Chat must be ended or expired to confirm hire status',
          errors: [
            {
              field: 'chatId',
              message: `Chat is currently ${chat.status.toLowerCase()}`,
              code: 'INVALID_CHAT_STATE',
            },
          ],
        });
      }

      // Update HireRequest status
      const newStatus = hired ? RequestStatus.HIRED : RequestStatus.NOT_HIRED;
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Set hiredAt timestamp if hired
      if (hired) {
        updateData.hiredAt = new Date();
      }

      const hireRequest = await this.prisma.hireRequest.updateMany({
        where: { chatId },
        data: updateData,
      });

      if (hireRequest.count === 0) {
        this.logger.warn(`No HireRequest found for chat ${chatId}`);
      }

      // Log appropriate event
      const eventType = hired
        ? ChatEventType.PLAYER_HIRED
        : ChatEventType.HIRE_REQUEST_DECLINED;

      const eventMessage = hired
        ? 'Player hired.'
        : 'Player not hired.';

      this.logChatEvent(
        eventType,
        chatId,
        undefined,
        eventMessage,
        undefined,
        {
          hired,
          confirmedAt: new Date().toISOString(),
          playerEmail: userEmail,
          companyEmail,
        },
      ).catch((error) => {
        this.logger.error(`Failed to log hire confirmation event: ${error.message}`);
      });

      return {
        message: 'Hire status confirmed successfully',
        data: {
          chatId,
          status: newStatus,
          hired,
        },
      };
    } catch (error) {
      // Handle JWT-specific errors
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Confirmation link has expired',
          errors: [
            {
              field: 'token',
              message: 'This confirmation link is no longer valid. Please contact support if you need assistance.',
              code: 'TOKEN_EXPIRED',
            },
          ],
        });
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          message: 'Invalid confirmation link',
          errors: [
            {
              field: 'token',
              message: 'The confirmation link is invalid or has been tampered with',
              code: 'INVALID_TOKEN',
            },
          ],
        });
      }

      // Re-throw HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unexpected errors
      this.logger.error(
        `Error confirming hire status for chat ${chatId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to confirm hire status',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred while processing your confirmation',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async deleteChat(chatId: string, userId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const participantIds = chat.participantIds as string[];
      if (!participantIds.includes(userId)) {
        throw new ForbiddenException({
          message: 'Not a participant in this chat',
          errors: [
            {
              field: 'chatId',
              message: 'You are not authorized to delete this chat',
              code: 'NOT_PARTICIPANT',
            },
          ],
        });
      }

      const deletedBy = (chat.deletedBy as Record<string, string>) || {};
      const deletedAt = new Date().toISOString();
      deletedBy[userId] = deletedAt;

      await this.prisma.chat.update({
        where: { id: chatId },
        data: { deletedBy },
      });

      await this.cache.markAsDeleted(userId, chatId, deletedAt);
      await this.cache.resetUnreadCount(userId, chatId);

      return {
        message: 'Chat deleted successfully',
        data: {
          id: chatId,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error deleting chat ${chatId} by user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to delete chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async restoreChat(chatId: string, userId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        throw new NotFoundException({
          message: 'Chat not found',
          errors: [
            {
              field: 'chatId',
              message: 'Chat does not exist',
              code: 'CHAT_NOT_FOUND',
            },
          ],
        });
      }

      const deletedBy = (chat.deletedBy as Record<string, string>) || {};

      if (!deletedBy[userId]) {
        return;
      }

      delete deletedBy[userId];

      await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          deletedBy: Object.keys(deletedBy).length > 0 ? deletedBy : null,
        },
      });

      await this.cache.removeFromDeleted(userId, chatId);

      await this.cache.cacheChat({
        id: chat.id,
        status: chat.status,
        expiresAt: chat.expiresAt?.toISOString() || null,
        participantIds: chat.participantIds as string[],
        companyId: chat.companyId,
        playerId: chat.playerId,
        initiatorId: chat.initiatorId,
        acceptedAt: chat.acceptedAt?.toISOString() || null,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error restoring chat ${chatId} for user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to restore chat due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async getSuggestedProfiles(
    userId: string,
    userType: UserType,
    profileId: string,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { take, skip } = createPaginationParams(page, limit);

      // Get list of user IDs that current user is already chatting with
      const existingChats = await this.prisma.chat.findMany({
        where: {
          OR: [{ companyId: userId }, { playerId: userId }],
          status: { in: [ChatStatus.PENDING, ChatStatus.ACCEPTED] },
        },
        select: {
          companyId: true,
          playerId: true,
        },
      });

      // Extract user IDs to exclude (users already being chatted with)
      const chattingWithUserIds = existingChats.map((chat) =>
        chat.companyId === userId ? chat.playerId : chat.companyId,
      );

      if (userType === UserType.COMPANY) {
        // For companies, suggest players/supporters
        const whereClause: any = {
          userId: { notIn: [userId, ...chattingWithUserIds] }, // Exclude self and existing chats
          user: {
            status: UserStatus.ACTIVE,
            userType: { in: [UserType.PLAYER, UserType.SUPPORTER] },
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
          },
        };

        const [profiles, total] = await Promise.all([
          this.prisma.player.findMany({
            where: whereClause,
            skip,
            take,
            select: {
              id: true,
              avatar: true,
              address: true,
              clubId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  userType: true,
                },
              },
              club: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                  avatar: true,
                },
              },
            },
          }),
          this.prisma.player.count({ where: whereClause }),
        ]);

        const formattedProfiles = profiles.map((profile) => ({
          id: profile.user.id,
          name: profile.user.name,
          userType: profile.user.userType,
          avatar: profile.avatar || undefined,
          location: profile.address || undefined,
          club: profile.club
            ? {
                id: profile.club.id,
                name: profile.club.user.name,
                avatar: profile.club.avatar || undefined,
              }
            : undefined,
        }));

        return {
          message: 'Suggested profiles retrieved successfully',
          data: {
            data: formattedProfiles,
            ...createPaginationMeta(total, page, limit),
          },
        };
      } else if (
        userType === UserType.PLAYER ||
        userType === UserType.SUPPORTER
      ) {
        // For players/supporters, suggest companies
        const whereClause: any = {
          userId: { notIn: [userId, ...chattingWithUserIds] }, // Exclude self and existing chats
          user: {
            status: UserStatus.ACTIVE,
            userType: UserType.COMPANY,
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
          },
        };

        const [profiles, total] = await Promise.all([
          this.prisma.company.findMany({
            where: whereClause,
            skip,
            take,
            select: {
              id: true,
              avatar: true,
              address: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  userType: true,
                },
              },
            },
          }),
          this.prisma.company.count({ where: whereClause }),
        ]);

        // Get current player's club info
        const player = await this.prisma.player.findUnique({
          where: { id: profileId },
          select: {
            clubId: true,
            club: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                  },
                },
                avatar: true,
              },
            },
          },
        });

        const formattedProfiles = profiles.map((profile) => ({
          id: profile.user.id,
          name: profile.user.name,
          userType: profile.user.userType,
          avatar: profile.avatar || undefined,
          location: profile.address || undefined,
          club: player?.club
            ? {
                id: player.club.id,
                name: player.club.user.name,
                avatar: player.club.avatar || undefined,
              }
            : undefined,
        }));

        return {
          message: 'Suggested profiles retrieved successfully',
          data: {
            data: formattedProfiles,
            ...createPaginationMeta(total, page, limit),
          },
        };
      }

      // Fallback for unsupported user types
      return {
        message: 'No suggested profiles available',
        data: {
          data: [],
          ...createPaginationMeta(0, page, limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error retrieving suggested profiles for user ${userId}:`,
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException({
        message: 'Failed to retrieve suggested profiles due to server error',
        errors: [
          {
            field: 'server',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      });
    }
  }

  async getSuggestedProfileById(currentUserId: string, profileUserId: string) {
    try {
      if (currentUserId === profileUserId) {
        throw new BadRequestException(
          'Cannot get your own profile as a suggestion.',
        );
      }

      const profileUser = await this.prisma.user.findUnique({
        where: { id: profileUserId },
        select: {
          id: true,
          name: true,
          userType: true,
          status: true,
          player: {
            select: {
              id: true,
              avatar: true,
              address: true,
              club: {
                select: {
                  id: true,
                  user: { select: { name: true } },
                  avatar: true,
                },
              },
            },
          },
          company: {
            select: {
              id: true,
              avatar: true,
              address: true,
            },
          },
        },
      });

      if (!profileUser || profileUser.status !== UserStatus.ACTIVE) {
        throw new NotFoundException(
          'Suggested profile not found or is not active.',
        );
      }

      let clubInfo;
      if (
        profileUser.userType === UserType.PLAYER ||
        profileUser.userType === UserType.SUPPORTER
      ) {
        // If the suggested profile is a player, use their club info
        if (profileUser.player?.club) {
          clubInfo = {
            id: profileUser.player.club.id,
            name: profileUser.player.club.user.name,
            avatar: profileUser.player.club.avatar || undefined,
          };
        }
      } else {
        // If the suggested profile is a company, we might want to show the current user's club
        const currentUserProfile = await this.prisma.user.findUnique({
          where: { id: currentUserId },
          select: {
            player: {
              select: {
                club: {
                  select: {
                    id: true,
                    user: { select: { name: true } },
                    avatar: true,
                  },
                },
              },
            },
          },
        });
        if (currentUserProfile?.player?.club) {
          clubInfo = {
            id: currentUserProfile.player.club.id,
            name: currentUserProfile.player.club.user.name,
            avatar: currentUserProfile.player.club.avatar || undefined,
          };
        }
      }

      const profileDetails =
        profileUser.userType === UserType.COMPANY
          ? profileUser.company
          : profileUser.player;

      const formattedProfile = {
        id: profileUser.id,
        name: profileUser.name,
        userType: profileUser.userType,
        avatar: profileDetails?.avatar || undefined,
        location: profileDetails?.address || undefined,
        club: clubInfo,
      };

      return {
        message: 'Suggested profile retrieved successfully',
        data: formattedProfile,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Error getting suggested profile by ID ${profileUserId} for user ${currentUserId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve suggested profile.',
      );
    }
  }

  async getBulkSuggestedProfilesById(
    currentUserId: string,
    currentUserType: UserType,
    profileUserIds: string[],
  ) {
    try {
      // Determine allowed userTypes based on current user's type
      const allowedUserTypes: UserType[] =
        currentUserType === UserType.COMPANY
          ? [UserType.PLAYER, UserType.SUPPORTER]
          : [UserType.COMPANY];

      // Remove duplicates and filter out current user's ID
      const uniqueIds = [
        ...new Set(profileUserIds.filter((id) => id !== currentUserId)),
      ];

      if (uniqueIds.length === 0) {
        return {
          message: 'No valid profile IDs to fetch',
          data: {
            profiles: [],
            failed: profileUserIds.map((id) => ({
              id,
              reason:
                id === currentUserId
                  ? 'Cannot get your own profile as a suggestion'
                  : 'Invalid ID',
            })),
          },
        };
      }

      // Fetch current user's club info once (for company profiles)
      const currentUserProfile = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          player: {
            select: {
              club: {
                select: {
                  id: true,
                  user: { select: { name: true } },
                  avatar: true,
                },
              },
            },
          },
        },
      });

      const currentUserClubInfo = currentUserProfile?.player?.club
        ? {
            id: currentUserProfile.player.club.id,
            name: currentUserProfile.player.club.user.name || '',
            avatar: currentUserProfile.player.club.avatar || undefined,
          }
        : undefined;

      const results = await Promise.allSettled(
        uniqueIds.map(async (profileUserId) => {
          const profileUser = await this.prisma.user.findUnique({
            where: { id: profileUserId },
            select: {
              id: true,
              name: true,
              userType: true,
              status: true,
              player: {
                select: {
                  id: true,
                  avatar: true,
                  address: true,
                  club: {
                    select: {
                      id: true,
                      user: { select: { name: true } },
                      avatar: true,
                    },
                  },
                },
              },
              company: {
                select: {
                  id: true,
                  avatar: true,
                  address: true,
                },
              },
            },
          });

          if (!profileUser || profileUser.status !== UserStatus.ACTIVE) {
            throw new Error('Profile not found or is not active');
          }

          // Validate userType matches allowed types for suggestions
          if (!allowedUserTypes.includes(profileUser.userType)) {
            throw new Error(
              `Invalid profile type. ${currentUserType === UserType.COMPANY ? 'Companies can only message players/supporters' : 'Players/supporters can only message companies'}`,
            );
          }

          let clubInfo:
            | { id: string; name: string; avatar?: string }
            | undefined;
          if (
            profileUser.userType === UserType.PLAYER ||
            profileUser.userType === UserType.SUPPORTER
          ) {
            // If the suggested profile is a player, use their club info
            if (profileUser.player?.club) {
              clubInfo = {
                id: profileUser.player.club.id,
                name: profileUser.player.club.user.name || '',
                avatar: profileUser.player.club.avatar || undefined,
              };
            }
          } else {
            // If the suggested profile is a company, use the current user's club
            clubInfo = currentUserClubInfo;
          }

          const profileDetails =
            profileUser.userType === UserType.COMPANY
              ? profileUser.company
              : profileUser.player;

          return {
            id: profileUser.id,
            name: profileUser.name,
            userType: profileUser.userType,
            avatar: profileDetails?.avatar || undefined,
            location: profileDetails?.address || undefined,
            club: clubInfo,
          };
        }),
      );

      // Separate successful and failed results
      const profiles: any[] = [];
      const failed: Array<{ id: string; reason: string }> = [];

      results.forEach((result, index) => {
        const profileUserId = uniqueIds[index];
        if (result.status === 'fulfilled') {
          profiles.push(result.value);
        } else {
          failed.push({
            id: profileUserId,
            reason: result.reason?.message || 'Failed to fetch profile',
          });
        }
      });

      // Add IDs that were filtered out (current user or duplicates)
      const processedIds = new Set(uniqueIds);
      profileUserIds.forEach((id) => {
        if (!processedIds.has(id)) {
          failed.push({
            id,
            reason:
              id === currentUserId
                ? 'Cannot get your own profile as a suggestion'
                : 'Duplicate ID',
          });
        }
      });

      return {
        message: `Retrieved ${profiles.length} profile(s), ${failed.length} failed`,
        data: {
          profiles,
          failed,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting bulk suggested profiles for user ${currentUserId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve suggested profiles.',
      );
    }
  }

  /**
   * Async helper to update HireRequest status without blocking the main operation
   * This runs in the background and logs errors without throwing
   * @param chatId The chat ID
   * @param status The new RequestStatus
   * @param eventType The ChatEventType to log
   * @param userId The user performing the action (for logging)
   */
  private async updateHireRequestStatusAsync(
    chatId: string,
    status: RequestStatus,
    eventType: ChatEventType,
    userId: string,
  ): Promise<void> {
    try {
      // Update HireRequest status
      const updateResult = await this.prisma.hireRequest.updateMany({
        where: { chatId },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        this.logger.warn(
          `No HireRequest found for chat ${chatId} during async status update to ${status}`,
        );
        return;
      }

      this.logger.debug(
        `HireRequest updated to ${status} for chat ${chatId}`,
      );
    } catch (error) {
      // Log error but don't throw - this is fire-and-forget
      this.logger.error(
        `Failed to update HireRequest status for chat ${chatId}:`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  /**
   * Async helper to create HireRequest without blocking chat creation
   * @param chatId The chat ID
   * @param companyProfileId The company profile ID
   * @param playerProfileId The player profile ID
   * @param initiatorId The user who initiated the chat
   * @param recipientId The recipient user ID
   */
  private async createHireRequestAsync(
    chatId: string,
    companyProfileId: string,
    playerProfileId: string,
    initiatorId: string,
    recipientId: string,
  ): Promise<void> {
    try {
      const hireRequestCode = this.generateHireRequestCode();
      const hireRequest = await this.prisma.hireRequest.create({
        data: {
          requestCode: hireRequestCode,
          chatId,
          companyId: companyProfileId,
          playerId: playerProfileId,
          initiatorId,
          recipientId,
          status: RequestStatus.PENDING,
        },
      });

      this.logger.debug(
        `HireRequest ${hireRequest.id} created asynchronously for chat ${chatId}`,
      );
    } catch (error) {
      // Log error but don't throw - this is fire-and-forget
      this.logger.error(
        `Failed to create HireRequest for chat ${chatId}:`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
