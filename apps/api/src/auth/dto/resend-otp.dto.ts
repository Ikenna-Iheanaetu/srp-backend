import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ResendOtpSchema = z.object({
  email: z.string().email(),
});

export class ResendOtpDto extends createZodDto(ResendOtpSchema) {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;
}
