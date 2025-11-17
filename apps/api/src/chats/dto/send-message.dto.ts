import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MessageAttachmentDto } from './message-attachment.dto';

const SendMessageSchema = z.object({
  content: z.string().max(1000).optional(),
  attachments: z.array(z.any()).optional(),
});

export class SendMessageDto extends createZodDto(SendMessageSchema) {
  content?: string;
  attachments?: MessageAttachmentDto[];
}
