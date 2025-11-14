import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export class LoginDto extends createZodDto(LoginSchema) {
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;
}
