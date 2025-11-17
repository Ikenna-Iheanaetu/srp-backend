import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodMongoId } from 'src/common/validators';

const AttachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  category: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().optional(),
});

const CreateChatSchema = z.object({
  recipientId: zodMongoId(),
  content: z.string().max(1000).optional(),
  attachments: z.array(AttachmentSchema).optional(),
}).refine(
  (data) => (data.content && data.content.length > 0) || (data.attachments && data.attachments.length > 0),
  { message: 'Either content or attachments must be provided' }
);

class AttachmentDto {
  @ApiProperty({ description: 'Attachment filename' })
  name: string;

  @ApiProperty({ description: 'Attachment URL' })
  url: string;

  @ApiProperty({ description: 'Attachment category (image, video, document, audio)' })
  category: string;

  @ApiProperty({ description: 'Attachment MIME type' })
  mimeType: string;

  @ApiPropertyOptional({ description: 'Attachment size in bytes' })
  size?: number;
}

export class CreateChatDto extends createZodDto(CreateChatSchema) {
  @ApiProperty({ description: 'Recipient user ID' })
  recipientId: string;

  @ApiPropertyOptional({ description: 'Initial message text content' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Initial message attachments',
    type: [AttachmentDto]
  })
  attachments?: AttachmentDto[];
}
