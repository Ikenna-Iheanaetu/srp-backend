import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {
  @ApiProperty({
    description: 'The password reset token received after OTP verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
  })
  password: string;
}
