import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ChatsController } from './chats.controller';
import { ChatsPublicController } from './chats-public.controller';
import { ChatsService } from './services/chats.service';
import { ChatCacheService } from './services/chat-cache.service';
import { MessageIdResolverService } from './services/message-id-resolver.service';
import { ChatsGateway } from './chats.gateway';
import { MessagesProcessor } from './processors/messages.processor';
import { ChatExpiryProcessor } from './processors/chat-expiry.processor';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { UtilsModule } from '../utils/utils.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    UtilsModule,
    EmailModule,
    JwtModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'messages',
    }),
    BullModule.registerQueue({
      name: 'chat-expiry',
    }),
  ],
  controllers: [ChatsController, ChatsPublicController],
  providers: [
    ChatsService,
    ChatCacheService,
    MessageIdResolverService,
    ChatsGateway,
    MessagesProcessor,
    ChatExpiryProcessor,
    WsAuthGuard,
  ],
  exports: [ChatsService, ChatCacheService],
})
export class ChatsModule {}
