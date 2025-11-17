import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const VerifyAccountSchema = z.object({
  otp: z.string().min(1),
  email: z.string().email(),
});

export class VerifyAccountDto extends createZodDto(VerifyAccountSchema) {
  @ApiProperty({
    description: 'OTP code received via email',
    example: '123456',
  })
  otp: string;

  @ApiProperty({
    description: 'Email to be verified',
    example: 'example@gmail.com',
  })
  email: string;
}
