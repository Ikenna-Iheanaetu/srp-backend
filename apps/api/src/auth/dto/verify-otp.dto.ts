import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodEnumTransform } from 'src/common/validators';

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1),
  type: zodEnumTransform(OtpType),
});

export class VerifyOtpDto extends createZodDto(VerifyOtpSchema) {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'OTP code received via email',
    example: '123456',
  })
  otp: string;

  @ApiProperty({
    description: 'Type of OTP being verified',
    enum: Object.values(OtpType).map((v) => v.toLowerCase()),
    example: OtpType.PASSWORD_RESET.toLowerCase(),
  })
  type: OtpType;
}
