import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UtilsModule } from './utils/utils.module';
import { EmailModule } from './email/email.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AdminModule } from './admin/admin.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessModule } from './common/jwt-access.module';
import { CompanyModule } from './company/company.module';
import { ClubModule } from './club/club.module';
import { PlayerSupporterModule } from './player-supporter/player-supporter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatsModule } from './chats/chats.module';
import { RedisModule } from './redis/redis.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV || 'development'}`],
    }),
    // Bull Queue with Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        },
      }),
      inject: [ConfigService],
    }),
    // JWT Authentication
    JwtAccessModule,
    AuthModule,
    PrismaModule,
    RedisModule,
    UtilsModule,
    EmailModule,
    AdminModule,
    CompanyModule,
    ClubModule,
    PlayerSupporterModule,
    NotificationsModule,
    ChatsModule,
  ],
  controllers: [AppController],
  providers: [
    // Global Response Interceptor (Makes ALL responses consistent)
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Global Exception Filter (Handles ALL errors consistently)
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    AppService,
    PrismaService,
  ],
})
export class AppModule {}
