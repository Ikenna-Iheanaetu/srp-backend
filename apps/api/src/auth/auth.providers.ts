import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

export const REFRESH_JWT_SERVICE = 'REFRESH_JWT_SERVICE';

export const RefreshJwtProvider = {
  provide: REFRESH_JWT_SERVICE,
  useFactory: (config: ConfigService) => {
    const secret = config.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('Environment variable JWT_REFRESH_SECRET is required');
    }

    return new JwtService({
      secret,
      signOptions: {
        expiresIn: config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    });
  },
  inject: [ConfigService],
};

export const GOOGLE_OAUTH_CLIENT = 'GOOGLE_OAUTH_CLIENT';

export const GoogleOAuthClientProvider = {
  provide: GOOGLE_OAUTH_CLIENT,
  useFactory: (config: ConfigService) => {
    const clientId = config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('Environment variable GOOGLE_CLIENT_ID is required');
    }
    return new OAuth2Client(clientId);
  },
  inject: [ConfigService],
};
