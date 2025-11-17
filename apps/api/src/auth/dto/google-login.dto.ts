import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GoogleLoginSchema = z.object({
  authToken: z.string().min(1),
});

export class GoogleLoginDto extends createZodDto(GoogleLoginSchema) {
  @ApiProperty({
    description: 'Google OAuth token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  authToken: string;
}
