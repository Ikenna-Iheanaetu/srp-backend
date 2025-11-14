import {
    Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OtpStatus, OtpType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class OtpUtilsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOTP(length = 6): string {
    return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
  }

  async generateAndSaveOtp(
    email: string,
    type: OtpType,
    userId?: string,
    affiliateId?: string,
    expirationMinutes: number = 10,
  ) {
    const otp = this.generateOTP();
    const hashedCode = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + expirationMinutes * 60_000);

    await this.prisma.otpCode.updateMany({
      where: {
        email,
        type,
        status: OtpStatus.ACTIVE,
      },
      data: { status: OtpStatus.REVOKED },
    });

    await this.prisma.otpCode.create({
      data: {
        userId,
        affiliateId,
        email,
        hashedCode,
        type,
        expiresAt,
      },
    });

    return otp;
  }

  async verifyOtp(email: string, code: string, type: OtpType) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        email,
        type,
        status: OtpStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            userType: true, // Add userType to selection
            email: true,
          },
        },
      },
    });

    if (!otpRecord) {
      throw new UnauthorizedException({
        message: 'Invalid OTP',
        errors: [
          {
            field: 'otp',
            message: 'OTP not found or already used',
            code: 'INVALID_OTP',
          },
        ],
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { status: OtpStatus.EXPIRED },
      });

      throw new UnauthorizedException({
        message: 'Invalid or expired OTP',
        errors: [
          {
            field: 'otp',
            message: 'The OTP has expired',
            code: 'OTP_EXPIRED',
          },
        ],
      });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new UnauthorizedException({
        message: 'Maximum attempts exceeded',
        errors: [
          {
            field: 'otp',
            message: 'Too many failed attempts',
            code: 'MAX_ATTEMPTS_EXCEEDED',
          },
        ],
      });
    }

    const isValid = await bcrypt.compare(code, otpRecord.hashedCode);

    if (!isValid) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      throw new UnauthorizedException({
        message: 'Your OTP is wrong',
        errors: [
          {
            field: 'otp',
            message: 'Invalid OTP code',
            code: 'INVALID_OTP',
          },
        ],
      });
    }

    // Mark as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { status: OtpStatus.USED },
    });

    return otpRecord;
  }
}
