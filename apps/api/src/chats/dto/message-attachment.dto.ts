import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export enum AttachmentCategory {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

const MessageAttachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  category: z.nativeEnum(AttachmentCategory),
  mimeType: z.string().min(1),
  size: z.number().optional(),
});

export class MessageAttachmentDto extends createZodDto(MessageAttachmentSchema) {
  @ApiProperty({ description: 'File name' })
  name: string;

  @ApiProperty({ description: 'Public URL to the file' })
  url: string;

  @ApiProperty({ enum: AttachmentCategory, description: 'Category of the attachment' })
  category: AttachmentCategory;

  @ApiProperty({ description: 'MIME type of the file' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes', required: false })
  size?: number;
}

/**
 * Helper function to determine attachment category from MIME type
 */
export function getAttachmentCategory(mimeType: string): AttachmentCategory {
  if (mimeType.startsWith('image/')) {
    return AttachmentCategory.IMAGE;
  } else if (mimeType.startsWith('audio/')) {
    return AttachmentCategory.AUDIO;
  } else if (mimeType.startsWith('video/')) {
    return AttachmentCategory.VIDEO;
  } else {
    return AttachmentCategory.DOCUMENT;
  }
}
