import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

// Custom decorator to specify token type
export const TokenType = (tokenType: 'access' | 'refresh') =>
  SetMetadata('tokenType', tokenType);

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // Get token type from decorator (defaults to 'access')
    const tokenType =
      this.reflector.get('tokenType', context.getHandler()) || 'access';

    if (!token) {
      this.logger.warn(`No ${tokenType} token provided in request`);
      throw new UnauthorizedException({
        message: `${tokenType === 'access' ? 'Access' : 'Refresh'} token required`,
        errors: [
          {
            field: 'authorization',
            message: `Authorization header with Bearer ${tokenType} token is required`,
            code: 'MISSING_TOKEN',
          },
        ],
      });
    }

    try {
      // Use appropriate secret based on token type
      const secret =
        tokenType === 'access'
          ? this.config.get('JWT_SECRET')
          : this.config.get('JWT_REFRESH_SECRET');

      // Verify JWT token
      const payload = this.jwtService.verify(token, { secret });

      // Check if user still exists and is active
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
        this.logger.warn(
          `User not found for ${tokenType} token payload: ${payload.sub}`,
        );
        throw new UnauthorizedException({
          message: 'Invalid token - user not found',
          errors: [
            {
              field: 'token',
              message: 'User associated with this token no longer exists',
              code: 'USER_NOT_FOUND',
            },
          ],
        });
      }

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(`Inactive user attempted access: ${user.email}`);
        throw new UnauthorizedException({
          message: 'Account is not active',
          errors: [
            {
              field: 'account',
              message:
                'Your account needs to be activated before you can access this resource',
              code: 'ACCOUNT_INACTIVE',
            },
          ],
        });
      }

      // Attach user info to request
      request.user = {
        userId: user.id,
        profileId: payload.profileId,
        email: user.email,
        userType: user.userType,
        status: user.status,
        jti: payload.jti,
      };

      // If it's a refresh token, also attach the raw token
      if (tokenType === 'refresh') {
        request.refreshToken = token;
      }

      return true;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        this.logger.warn(`Invalid ${tokenType} token provided`);
        throw new UnauthorizedException({
          message: 'Invalid token',
          errors: [
            {
              field: 'token',
              message: 'The provided token is malformed or invalid',
              code: 'INVALID_TOKEN',
            },
          ],
        });
      }

      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`Expired ${tokenType} token provided`);
        throw new UnauthorizedException({
          message: 'Token expired',
          errors: [
            {
              field: 'token',
              message: 'The provided token has expired',
              code: 'TOKEN_EXPIRED',
            },
          ],
        });
      }

      // If it's already an UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle other errors
      this.logger.error(
        `Unexpected error during ${tokenType} token authentication:`,
        error,
      );
      throw new UnauthorizedException({
        message: 'Authentication failed',
        errors: [
          {
            field: 'authentication',
            message: 'Unable to verify authentication credentials',
            code: 'AUTH_FAILED',
          },
        ],
      });
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : undefined;
  }
}
