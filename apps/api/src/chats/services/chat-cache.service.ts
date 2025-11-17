import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ChatStatus } from '@prisma/client';

export interface ChatCache {
  id: string;
  status: ChatStatus;
  expiresAt: string | null;
  participantIds: string[];
  companyId: string;
  playerId: string;
  initiatorId: string;
  acceptedAt: string | null;
}

export interface MessageCache {
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

@Injectable()
export class ChatCacheService {
  private readonly CHAT_TTL = 60 * 60 * 24; // 24 hours
  private readonly MESSAGES_TTL = 60 * 60 * 2; // 2 hours
  private readonly PRESENCE_TTL = 60 * 5; // 5 minutes

  constructor(private readonly redis: RedisService) {}

  async cacheChat(chat: ChatCache): Promise<void> {
    const key = `chat:${chat.id}`;
    await this.redis.set(key, JSON.stringify(chat), this.CHAT_TTL);
  }

  async getCachedChat(chatId: string): Promise<ChatCache | null> {
    const key = `chat:${chatId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateChatStatus(
    chatId: string,
    status: ChatStatus,
    expiresAt?: Date | null,
    acceptedAt?: Date | null,
  ): Promise<void> {
    const cached = await this.getCachedChat(chatId);
    if (cached) {
      cached.status = status;

      if (expiresAt !== undefined) {
        cached.expiresAt = expiresAt ? expiresAt.toISOString() : null;
      }

      if (acceptedAt !== undefined) {
        cached.acceptedAt = acceptedAt ? acceptedAt.toISOString() : null;
      }

      await this.cacheChat(cached);
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    const key = `chat:${chatId}`;
    await this.redis.del(key);
  }

  async cacheMessages(chatId: string, messages: MessageCache[]): Promise<void> {
    const key = `messages:${chatId}`;
    const pipeline = this.redis.pipeline();

    pipeline.del(key);

    for (const message of messages) {
      const score = new Date(message.createdAt).getTime();
      pipeline.zadd(key, score, JSON.stringify(message));
    }

    pipeline.expire(key, this.MESSAGES_TTL);
    await pipeline.exec();
  }

  async addMessageToCache(
    chatId: string,
    message: MessageCache,
  ): Promise<void> {
    const key = `messages:${chatId}`;
    const score = new Date(message.createdAt).getTime();

    await this.redis.zadd(key, score, JSON.stringify(message));
    await this.redis.expire(key, this.MESSAGES_TTL);
    await this.redis.zremrangebyrank(key, 0, -101);
  }

  async getCachedMessages(chatId: string, limit = 50): Promise<MessageCache[]> {
    const key = `messages:${chatId}`;
    const messages = await this.redis.zrevrange(key, 0, limit - 1);
    return messages.map((msg) => JSON.parse(msg));
  }

  async getUserChatIds(userId: string): Promise<string[]> {
    const pattern = `chat:*`;
    const keys = await this.redis.keys(pattern);

    const chatIds: string[] = [];

    if (keys.length === 0) return chatIds;

    // Get all chat data in one batch
    const chatDataArray = await this.redis.mget(keys);

    for (let i = 0; i < chatDataArray.length; i++) {
      const chatData = chatDataArray[i];
      if (chatData) {
        try {
          const chat = JSON.parse(chatData) as ChatCache;
          if (chat.participantIds?.includes(userId)) {
            chatIds.push(chat.id);
          }
        } catch (error) {
          // Skip malformed cache entries
          continue;
        }
      }
    }

    return chatIds;
  }

  async updateMessageInCache(
    chatId: string,
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
  ): Promise<void> {
    const key = `messages:${chatId}`;

    // Get all messages to find the one we need to update
    const allMessages = await this.redis.zrange(key, 0, -1);

    if (!allMessages || allMessages.length === 0) {
      // No messages in cache, nothing to update
      return;
    }

    // Find the message with matching ID
    let messageToUpdate: MessageCache | null = null;
    let originalScore: number | null = null;
    let originalMessageString: string | null = null;

    for (const msgStr of allMessages) {
      const msg = JSON.parse(msgStr) as MessageCache;
      if (msg.id === messageId) {
        messageToUpdate = msg;
        originalScore = new Date(msg.createdAt).getTime();
        originalMessageString = msgStr;
        break;
      }
    }

    if (!messageToUpdate || !originalMessageString || originalScore === null) {
      // Message not found in cache, nothing to update
      return;
    }

    // Update the message with new values
    if (updates.content !== undefined) {
      messageToUpdate.content = updates.content;
    }

    if (updates.attachments !== undefined) {
      messageToUpdate.attachments = updates.attachments;
    }

    // Remove old message and add updated one with same score
    const pipeline = this.redis.pipeline();
    pipeline.zrem(key, originalMessageString);
    pipeline.zadd(key, originalScore, JSON.stringify(messageToUpdate));
    pipeline.expire(key, this.MESSAGES_TTL);
    await pipeline.exec();
  }

  async setUserOnline(userId: string, socketId: string): Promise<void> {
    const key = `presence:${userId}`;
    await this.redis.set(key, socketId, this.PRESENCE_TTL);
  }

  async setUserOffline(userId: string): Promise<void> {
    const key = `presence:${userId}`;
    await this.redis.del(key);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = `presence:${userId}`;
    return await this.redis.exists(key);
  }

  async getUserSocketId(userId: string): Promise<string | null> {
    const key = `presence:${userId}`;
    return await this.redis.get(key);
  }

  async incrementUnreadCount(userId: string, chatId: string): Promise<number> {
    const key = `unread:${userId}:${chatId}`;
    return await this.redis.incr(key);
  }

  async getUnreadCount(userId: string, chatId: string): Promise<number> {
    const key = `unread:${userId}:${chatId}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async resetUnreadCount(userId: string, chatId: string): Promise<void> {
    const key = `unread:${userId}:${chatId}`;
    await this.redis.del(key);
  }

  async getAllUnreadCounts(userId: string): Promise<Record<string, number>> {
    const pattern = `unread:${userId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length === 0) return {};

    const counts = await this.redis.mget(keys);
    const result: Record<string, number> = {};

    keys.forEach((key, index) => {
      const chatId = key.split(':')[2];
      result[chatId] = counts[index] ? parseInt(counts[index], 10) : 0;
    });

    return result;
  }

  async checkRateLimit(
    userId: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const key = `ratelimit:messages:${userId}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    return current <= limit;
  }

  /**
   * WebSocket connection rate limiting
   * Returns current attempt count for the given key (usually IP address)
   */
  async incrementConnectionAttempts(
    key: string,
    windowSeconds: number,
  ): Promise<number> {
    const redisKey = `ratelimit:ws_connect:${key}`;
    const current = await this.redis.incr(redisKey);

    if (current === 1) {
      await this.redis.expire(redisKey, windowSeconds);
    }

    return current;
  }

  /**
   * Clear connection rate limit on successful authentication
   */
  async clearConnectionAttempts(key: string): Promise<void> {
    const redisKey = `ratelimit:ws_connect:${key}`;
    await this.redis.del(redisKey);
  }

  async markAsDeleted(
    userId: string,
    chatId: string,
    deletedAt: string,
  ): Promise<void> {
    const setKey = `deleted:${userId}`;
    const timestampKey = `deleted:${userId}:${chatId}:at`;

    await this.redis.sadd(setKey, chatId);
    await this.redis.set(timestampKey, deletedAt);
  }

  async getDeletedChats(userId: string): Promise<string[]> {
    const key = `deleted:${userId}`;
    return await this.redis.smembers(key);
  }

  async getDeletedAt(userId: string, chatId: string): Promise<string | null> {
    const key = `deleted:${userId}:${chatId}:at`;
    return await this.redis.get(key);
  }

  async removeFromDeleted(userId: string, chatId: string): Promise<void> {
    const setKey = `deleted:${userId}`;
    const timestampKey = `deleted:${userId}:${chatId}:at`;

    await this.redis.srem(setKey, chatId);
    await this.redis.del(timestampKey);
  }

  /**
   * Cache chat metadata for quick access verification
   * This reduces DB queries by storing minimal chat info
   */
  async cacheChatMetadata(
    chatId: string,
    metadata: {
      participantIds: string[];
      status: ChatStatus;
      companyId: string;
      playerId: string;
    },
  ): Promise<void> {
    const key = `chat:meta:${chatId}`;
    await this.redis.set(key, JSON.stringify(metadata), 300); // 5 min TTL
  }

  /**
   * Get cached chat metadata without hitting the database
   */
  async getChatMetadata(chatId: string): Promise<{
    participantIds: string[];
    status: ChatStatus;
    companyId: string;
    playerId: string;
  } | null> {
    const key = `chat:meta:${chatId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Cache participant verification result
   * This avoids repeated DB queries for the same user/chat combination
   */
  async cacheParticipantVerification(
    chatId: string,
    userId: string,
    isParticipant: boolean,
  ): Promise<void> {
    const key = `participant:${chatId}:${userId}`;
    await this.redis.set(key, isParticipant ? '1' : '0', 300); // 5 min TTL
  }

  /**
   * Check if user is participant (from cache)
   */
  async isParticipantCached(
    chatId: string,
    userId: string,
  ): Promise<boolean | null> {
    const key = `participant:${chatId}:${userId}`;
    const result = await this.redis.get(key);
    if (result === null) return null;
    return result === '1';
  }

  /**
   * Invalidate chat metadata cache when chat is updated
   */
  async invalidateChatMetadata(chatId: string): Promise<void> {
    const metaKey = `chat:meta:${chatId}`;
    await this.redis.del(metaKey);

    // Also invalidate participant verification cache for this chat
    const pattern = `participant:${chatId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      // Delete all participant verification keys for this chat
      const pipeline = this.redis.pipeline();
      for (const key of keys) {
        pipeline.del(key);
      }
      await pipeline.exec();
    }
  }
}
