import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CodeGeneratorService } from './code-generator.utils';
import { MinioService } from './minio.utils';
import { OtpUtilsService } from './otp.utils';

@Module({
  imports: [PrismaModule],
  providers: [CodeGeneratorService, MinioService, OtpUtilsService],
  exports: [CodeGeneratorService, MinioService, OtpUtilsService],
})
export class UtilsModule {}
