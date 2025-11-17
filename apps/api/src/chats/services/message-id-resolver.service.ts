import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { RedisService } from '../../redis/redis.service';

/**
 * Redis-based service to resolve temporary message IDs to real MongoDB ObjectIds
 *
 * Handles race condition where clients try to mark messages as delivered
 * before the message has been persisted to the database.
 *
 * Uses Redis for cross-instance compatibility (ECS multi-container deployment).
 *
 * Flow:
 * 1. Gateway generates temp ID and stores it in Redis with "pending" status
 * 2. Message is emitted to clients immediately with temp ID
 * 3. Database insert happens asynchronously
 * 4. Real ID is stored in Redis, replacing the pending entry
 * 5. Delivery handler polls Redis to get the real ID
 */
@Injectable()
export class MessageIdResolverService {
  private readonly logger = new Logger(MessageIdResolverService.name);
  private readonly TEMP_ID_PREFIX = 'message:temp:';
  private readonly DEFAULT_TTL = 30; // 30 seconds
  private readonly POLL_INTERVAL = 100; // Poll every 100ms
  private readonly MAX_POLL_ATTEMPTS = 50; // 50 attempts * 100ms = 5 seconds max

  // Zod schema for MongoDB ObjectId validation
  private readonly objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

  constructor(private readonly redisService: RedisService) {}

  /**
   * Register a temporary ID as pending resolution
   * @param tempId The temporary ID (e.g., "temp_1234567890_abc")
   */
  async registerPendingTempId(tempId: string): Promise<void> {
    const key = this.getTempIdKey(tempId);

    try {
      // Store as "pending" with TTL
      await this.redisService.set(key, 'pending', this.DEFAULT_TTL);
      this.logger.debug(`Registered pending temp ID: ${tempId}`);
    } catch (error) {
      this.logger.error(`Failed to register temp ID ${tempId}:`, error);
      throw error;
    }
  }

  /**
   * Store the real ID for a temporary ID
   * @param tempId The temporary ID
   * @param realId The real MongoDB ObjectId
   */
  async storeTempIdMapping(tempId: string, realId: string): Promise<void> {
    const tempKey = this.getTempIdKey(tempId);
    const realKey = this.getRealIdKey(realId);

    try {
      // Store bidirectional mapping with TTL
      await Promise.all([
        this.redisService.set(tempKey, realId, this.DEFAULT_TTL), // tempId → realId
        this.redisService.set(realKey, tempId, this.DEFAULT_TTL), // realId → tempId
      ]);
      this.logger.debug(`Stored bidirectional mapping: ${tempId} ↔ ${realId}`);
    } catch (error) {
      this.logger.error(`Failed to store mapping for ${tempId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve a message ID to a real MongoDB ObjectId
   * @param messageId Either a temp ID or a real ObjectId
   * @param timeoutMs Maximum time to wait for resolution (default: 5000ms)
   * @returns The real ObjectId, or null if resolution failed
   */
  async resolveToRealId(messageId: string, timeoutMs = 5000): Promise<string | null> {
    // If it's already a valid ObjectId, return it immediately
    if (this.isValidObjectId(messageId)) {
      this.logger.debug(`${messageId} is already a valid ObjectId`);
      return messageId;
    }

    // It's a temp ID - check Redis
    const key = this.getTempIdKey(messageId);

    try {
      // Poll for the real ID with timeout
      const maxAttempts = Math.ceil(timeoutMs / this.POLL_INTERVAL);

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const value = await this.redisService.get(key);

        if (!value) {
          this.logger.warn(`No mapping found for temp ID: ${messageId} (may have expired)`);
          return null;
        }

        if (value === 'pending') {
          // Still waiting for DB operation - poll again
          if (attempt === 0) {
            this.logger.debug(`Temp ID ${messageId} is still pending, polling...`);
          }
          await this.sleep(this.POLL_INTERVAL);
          continue;
        }

        // Got the real ID
        this.logger.debug(`Resolved temp ID ${messageId} → ${value} (attempt ${attempt + 1})`);
        return value;
      }

      // Timeout reached
      this.logger.error(`Timeout waiting for temp ID ${messageId} to resolve after ${timeoutMs}ms`);
      return null;

    } catch (error) {
      this.logger.error(`Error resolving temp ID ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Check if a string is a valid MongoDB ObjectId using Zod
   * @param id The ID to check
   * @returns true if valid ObjectId, false otherwise
   */
  isValidObjectId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    const result = this.objectIdSchema.safeParse(id);
    return result.success;
  }

  /**
   * Resolve a real ID to its temporary ID (if one exists)
   * @param realId The real MongoDB ObjectId
   * @returns The temp ID, or null if no mapping exists
   */
  async resolveToTempId(realId: string): Promise<string | null> {
    // Only look up if it's a valid ObjectId
    if (!this.isValidObjectId(realId)) {
      return null;
    }

    const key = this.getRealIdKey(realId);

    try {
      const tempId = await this.redisService.get(key);
      if (tempId) {
        this.logger.debug(`Resolved real ID ${realId} → temp ID ${tempId}`);
      }
      return tempId;
    } catch (error) {
      this.logger.error(`Error resolving real ID ${realId}:`, error);
      return null;
    }
  }

  /**
   * Manually clean up a temp ID mapping
   * @param tempId The temporary ID to remove
   */
  async cleanup(tempId: string): Promise<void> {
    const key = this.getTempIdKey(tempId);

    try {
      await this.redisService.del(key);
      this.logger.debug(`Cleaned up temp ID: ${tempId}`);
    } catch (error) {
      this.logger.error(`Failed to clean up temp ID ${tempId}:`, error);
    }
  }

  /**
   * Get statistics about pending and resolved temp IDs
   * Useful for monitoring and debugging
   */
  async getStats(): Promise<{
    totalMappings: number;
    pendingCount: number;
    resolvedCount: number;
  }> {
    try {
      // Scan for all temp ID keys (use cursor-based scan for large datasets)
      const keys = await this.redisService.keys(`${this.TEMP_ID_PREFIX}*`);

      if (keys.length === 0) {
        return { totalMappings: 0, pendingCount: 0, resolvedCount: 0 };
      }

      // Get all values in a pipeline for efficiency
      const pipeline = this.redisService.pipeline();
      keys.forEach(key => pipeline.get(key));
      const results = await pipeline.exec();

      let pendingCount = 0;
      let resolvedCount = 0;

      results?.forEach(([err, value]) => {
        if (!err && value) {
          if (value === 'pending') {
            pendingCount++;
          } else {
            resolvedCount++;
          }
        }
      });

      return {
        totalMappings: keys.length,
        pendingCount,
        resolvedCount,
      };
    } catch (error) {
      this.logger.error('Failed to get stats:', error);
      return { totalMappings: 0, pendingCount: 0, resolvedCount: 0 };
    }
  }

  /**
   * Get the Redis key for a temp ID
   * @param tempId The temporary ID
   * @returns The Redis key
   */
  private getTempIdKey(tempId: string): string {
    return `${this.TEMP_ID_PREFIX}${tempId}`;
  }

  /**
   * Get the Redis key for reverse lookup (real ID → temp ID)
   * @param realId The real MongoDB ObjectId
   * @returns The Redis key
   */
  private getRealIdKey(realId: string): string {
    return `message:real:${realId}`;
  }

  /**
   * Sleep for a specified duration
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
