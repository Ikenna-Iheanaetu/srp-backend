import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CompanyPublicController } from './company-public.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailModule } from 'src/email/email.module';
import { UtilsModule } from 'src/utils';

@Module({
  imports: [PrismaModule, EmailModule, UtilsModule, HttpModule],
  controllers: [CompanyController, CompanyPublicController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
