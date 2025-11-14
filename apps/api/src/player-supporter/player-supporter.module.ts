import { Module } from '@nestjs/common';
import { PlayerSupporterService } from './player-supporter.service';
import { PlayerSupporterController } from './player-supporter.controller';
import { PlayerSupporterPublicController } from './player-supporter-public.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UtilsModule } from 'src/utils';
import { CompanyModule } from 'src/company/company.module';

@Module({
  imports: [PrismaModule, UtilsModule, CompanyModule],
  controllers: [PlayerSupporterController, PlayerSupporterPublicController],
  providers: [PlayerSupporterService],
  exports: [PlayerSupporterService],
})
export class PlayerSupporterModule {}
