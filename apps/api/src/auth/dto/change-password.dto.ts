import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SecurityQuestionSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  securityQuestion: SecurityQuestionSchema.optional(),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!',
  })
  oldPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Security question for additional verification',
    required: false,
    type: Object,
    example: {
      question: 'What is your favorite color?',
      answer: 'Blue',
    },
  })
  securityQuestion?: {
    question?: string;
    answer?: string;
  };
}
