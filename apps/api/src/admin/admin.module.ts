import { EmailModule } from 'src/email/email.module';
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UtilsModule } from 'src/utils';
import { CompanyModule } from 'src/company/company.module';
import { ClubModule } from 'src/club/club.module';
import { PlayerSupporterModule } from 'src/player-supporter/player-supporter.module';

@Module({
  imports: [
    PrismaModule,
    UtilsModule,
    CompanyModule,
    ClubModule,
    PlayerSupporterModule,
    EmailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
