import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Request DTO Schema
const confirmHireStatusSchema = z.object({
  hired: z.boolean().describe('Whether the player was hired or not'),

  userEmail: z.string().email('Invalid email format').describe('Player email address'),

  companyEmail: z.string().email('Invalid email format').describe('Company email address'),

  chatId: z.string().min(1, 'Chat ID cannot be empty').describe('Chat identifier'),

  token: z.string().min(1, 'Token cannot be empty').describe('JWT confirmation token from email'),
});

// Request DTO
export class ConfirmHireStatusDto extends createZodDto(confirmHireStatusSchema) {}

// Response DTO Schema
const confirmHireStatusResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    chatId: z.string(),
    status: z.enum(['HIRED', 'NOT_HIRED']),
    hired: z.boolean(),
  }),
});

// Response DTO
export class ConfirmHireStatusResponseDto extends createZodDto(confirmHireStatusResponseSchema) {}
