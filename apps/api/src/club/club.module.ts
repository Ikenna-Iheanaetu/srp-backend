import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UtilsModule } from 'src/utils';
import { EmailModule } from 'src/email/email.module';
import { ClubPublicController } from './club-public.controller';
import { ClubRefCodeController } from './club-refcode.controller';
import { ClubListController } from './club-list.controller';

@Module({
  imports: [PrismaModule, UtilsModule, EmailModule],
  controllers: [
    ClubController,
    ClubPublicController,
    ClubRefCodeController,
    ClubListController,
  ],
  providers: [ClubService],
  exports: [ClubService],
})
export class ClubModule {}
