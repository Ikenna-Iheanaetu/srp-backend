import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailModule } from 'src/email/email.module';
import { UtilsModule } from 'src/utils/utils.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RefreshJwtProvider,
  GoogleOAuthClientProvider,
} from './auth.providers';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    UtilsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshJwtProvider, GoogleOAuthClientProvider],
})
export class AuthModule {}
