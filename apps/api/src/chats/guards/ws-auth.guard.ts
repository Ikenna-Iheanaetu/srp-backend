import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WsException } from '@nestjs/websockets';
import { UserStatus } from '@prisma/client';
import { Socket } from 'socket.io';
import { ChatCacheService } from '../services/chat-cache.service';

/**
 * WebSocket Authentication Strategy (Option A: Long-Lived Sessions)
 *
 * Design Philosophy:
 * - Initial connection requires a valid (non-expired) access token
 * - Once connected, the socket remains alive as long as the refresh token is valid (7 days)
 * - Frontend does NOT need to implement token refresh logic for WebSocket connections
 *
 * Socket disconnects only when:
 * 1. User explicitly logs out (refresh token is revoked)
 * 2. Account is suspended/deactivated (status != ACTIVE)
 * 3. Network disconnection occurs
 *
 * Authentication Methods Supported:
 * 1. HTTP Authorization Header: `{ extraHeaders: { authorization: 'Bearer token' } }`
 * 2. Socket.IO Auth Object: `{ auth: { token: 'xxx' } }` or `{ auth: { authorization: 'Bearer token' } }`
 * 3. Socket.IO Auth Callback: `{ auth: (cb) => cb({ headers: { authorization: 'Bearer token' } }) }`
 *
 * Security Features:
 * - Periodic validation every 2 minutes to detect logout/suspension
 * - JTI-based session tracking links WebSocket to refresh token
 * - Redis-based connection rate limiting (10 attempts per 5 minutes per IP)
 * - Distributed rate limiting supports multi-instance deployments
 * - Generic error messages prevent token/user enumeration
 * - Memory leak prevention with tracked validation intervals
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  // Track validation intervals for proper cleanup (memory leak prevention)
  private validationIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: ChatCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    await this.authenticateConnection(client);
    return true;
  }

  async authenticateConnection(client: Socket): Promise<void> {
    // Connection rate limiting - prevent brute-force attacks
    const clientIp = this.extractClientIp(client);
    const rateLimitKey = `ws_connect:${clientIp}`;
    const attempts = await this.incrementConnectionAttempts(rateLimitKey);

    if (attempts > 10) {
      this.logger.warn(`Too many connection attempts from IP: ${clientIp}`);
      throw new WsException('Authentication failed');
    }

    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      this.logger.warn(`No token provided in WebSocket connection from IP: ${clientIp}`);
      throw new WsException('Authentication failed');
    }

    try {
      const secret = this.config.get('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          userType: true,
          status: true,
        },
      });

      if (!user) {
        this.logger.warn(`User not found for token payload: ${payload.sub}`);
        throw new WsException('Authentication failed');
      }

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(`Inactive user attempted WebSocket access: ${user.email}`);
        throw new WsException('Authentication failed');
      }

      client.data.user = {
        userId: user.id,
        profileId: payload.profileId,
        email: user.email,
        userType: user.userType,
        status: user.status,
        jti: payload.jti,
      };

      this.setupPeriodicValidation(client, user.id, payload.jti);

      // Clear rate limit on successful authentication
      await this.clearConnectionAttempts(rateLimitKey);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        this.logger.warn(`Invalid token provided for WebSocket connection from IP: ${clientIp}`);
        throw new WsException('Authentication failed');
      }

      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`Expired token provided for WebSocket connection from IP: ${clientIp}`);
        throw new WsException('Authentication failed');
      }

      if (error instanceof WsException) {
        throw error;
      }

      this.logger.error('Unexpected error during WebSocket authentication:', error);
      throw new WsException('Authentication failed');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    // Method 1: Check HTTP Authorization header (Postman, extraHeaders approach)
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    // Method 2: Check auth object (Socket.IO auth callback/object approach)
    const auth = client.handshake.auth as any;
    if (auth) {
      // Support { headers: { authorization: 'Bearer token' } }
      if (auth.headers?.authorization) {
        const [type, token] = auth.headers.authorization.split(' ');
        if (type === 'Bearer' && token) {
          return token;
        }
      }

      // Support { token: 'xxx' } or { authorization: 'Bearer token' }
      if (auth.token) {
        return auth.token;
      }

      if (auth.authorization) {
        const [type, token] = auth.authorization.split(' ');
        if (type === 'Bearer' && token) {
          return token;
        }
        // Also support direct token without 'Bearer' prefix
        return auth.authorization;
      }
    }

    return undefined;
  }

  private setupPeriodicValidation(client: Socket, userId: string, jti: string): void {
    const VALIDATION_INTERVAL = 2 * 60 * 1000; // 2 minutes (tighter security)

    const validationInterval = setInterval(async () => {
      try {
        // Check both session validity and user status
        // Only look for non-revoked tokens to avoid disconnecting during token refresh
        const [activeToken, user] = await Promise.all([
          this.prisma.refreshToken.findFirst({
            where: { jti, userId, revoked: false },
            select: { id: true },
          }),
          this.prisma.user.findUnique({
            where: { id: userId },
            select: { status: true },
          }),
        ]);

        // Disconnect if NO active (non-revoked) session exists (user logged out)
        if (!activeToken) {
          this.logger.warn(`No active session found for JTI ${jti} - disconnecting user ${userId}`);
          this.cleanupValidation(client.id);
          client.disconnect();
          return;
        }

        // Disconnect if user is no longer active (suspended/deleted)
        if (!user || user.status !== UserStatus.ACTIVE) {
          this.logger.warn(`User ${userId} is no longer active - disconnecting WebSocket`);
          this.cleanupValidation(client.id);
          client.disconnect();
          return;
        }
      } catch (error) {
        this.logger.error(`Error during periodic validation for user ${userId}:`, error);
        this.cleanupValidation(client.id);
        client.disconnect();
      }
    }, VALIDATION_INTERVAL);

    // Store interval for memory leak prevention
    this.validationIntervals.set(client.id, validationInterval);

    // Clean up interval on disconnect
    client.on('disconnect', () => {
      this.cleanupValidation(client.id);
    });
  }

  /**
   * Clean up validation interval to prevent memory leaks
   */
  private cleanupValidation(clientId: string): void {
    const interval = this.validationIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.validationIntervals.delete(clientId);
    }
  }

  /**
   * Extract client IP address from socket handshake
   */
  private extractClientIp(client: Socket): string {
    // Try to get real IP from proxy headers first
    const forwardedFor = client.handshake.headers['x-forwarded-for'];
    if (forwardedFor) {
      // x-forwarded-for can be comma-separated list, take first one
      return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
    }

    // Fall back to direct connection IP
    return client.handshake.address || 'unknown';
  }

  /**
   * Increment connection attempts for rate limiting using Redis
   * Returns current attempt count
   */
  private async incrementConnectionAttempts(key: string): Promise<number> {
    const RATE_LIMIT_WINDOW = 5 * 60; // 5 minutes in seconds
    return await this.cache.incrementConnectionAttempts(key, RATE_LIMIT_WINDOW);
  }

  /**
   * Clear connection attempts on successful authentication
   */
  private async clearConnectionAttempts(key: string): Promise<void> {
    await this.cache.clearConnectionAttempts(key);
  }
}
