import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatCacheService } from '../services/chat-cache.service';
import { ChatsService } from '../services/chats.service';
import { ChatStatus, ChatEventType } from '@prisma/client';

interface ExpiryJob {
  chatId: string;
}

@Injectable()
@Processor('chat-expiry')
export class ChatExpiryProcessor {
  private readonly logger = new Logger(ChatExpiryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: ChatCacheService,
    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
    @Inject(forwardRef(() => require('../chats.gateway').ChatsGateway))
    private readonly gateway: any,
  ) {}

  @Process('expire-chat')
  async handleChatExpiration(job: Job<ExpiryJob>) {
    const { chatId } = job.data;

    this.logger.log(`Processing expiration for chat ${chatId}`);

    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          company: { select: { name: true, email: true } },
          player: { select: { name: true, email: true } },
        },
      });

      if (!chat) {
        this.logger.warn(`Chat ${chatId} not found, skipping expiration`);
        return { success: false, reason: 'chat_not_found' };
      }

      if (chat.status !== ChatStatus.ACCEPTED) {
        this.logger.log(`Chat ${chatId} is ${chat.status}, skipping expiration`);
        return { success: false, reason: 'invalid_status' };
      }

      // Update chat status to EXPIRED
      await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          status: ChatStatus.EXPIRED,
        },
      });

      // Update cache
      await this.cache.updateChatStatus(chatId, ChatStatus.EXPIRED);

      // Log CHAT_EXPIRED event (fire and forget)
      this.chatsService.logChatEvent(
        ChatEventType.CHAT_EXPIRED,
        chatId,
        undefined,
        'Conversation expired.',
        undefined,
        {
          expiredAt: new Date().toISOString(),
        },
      ).catch((error) => {
        this.logger.error(`Failed to log chat expired event: ${error.message}`);
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

      // Emit WebSocket event to all participants with full chat details
      // Get chat participants to emit individually with proper perspective
      const fullChat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          participantIds: true,
        },
      });

      if (fullChat) {
        const participantIds = fullChat.participantIds as string[];

        // Emit to each participant with their perspective of the chat
        for (const participantId of participantIds) {
          try {
            const fullChatData = await this.chatsService.getChatById(chatId, participantId);
            const socketId = await this.cache.getUserSocketId(participantId);

            if (socketId) {
              this.gateway.server.to(socketId).emit('chat:expired', fullChatData.data);
            }
          } catch (error) {
            this.logger.error(`Failed to notify participant ${participantId} of expiration: ${error.message}`);
          }
        }
      }

      this.logger.log(`Chat ${chatId} expired successfully`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error expiring chat ${chatId}:`, error);
      throw error; // Re-throw for Bull retry mechanism
    }
  }

  @OnQueueFailed()
  handleFailed(job: Job, error: Error) {
    this.logger.error(
      `Expiry job ${job.id} for chat ${job.data.chatId} failed: ${error.message}`,
      error.stack,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleExpiryReminders() {
    this.logger.log('Checking for chats expiring soon...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const soonToExpire = await this.prisma.chat.findMany({
        where: {
          status: ChatStatus.ACCEPTED,
          expiresAt: {
            gte: tomorrow,
            lte: dayAfterTomorrow,
          },
        },
        select: {
          id: true,
          companyId: true,
          playerId: true,
          expiresAt: true,
        },
      });

      this.logger.log(`Found ${soonToExpire.length} chats expiring within 24 hours`);
    } catch (error) {
      this.logger.error('Error checking expiry reminders:', error);
    }
  }
}
