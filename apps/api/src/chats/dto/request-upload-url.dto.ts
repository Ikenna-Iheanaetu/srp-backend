import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RequestUploadUrlSchema = z.object({
  fileNames: z.array(z.string().min(1)).min(1, 'At least one filename is required').max(10, 'Cannot upload more than 10 files at once'),
});

export class RequestUploadUrlDto extends createZodDto(RequestUploadUrlSchema) {
  @ApiProperty({
    description: 'Array of filenames with extensions (max 10 files)',
    example: ['document.pdf', 'image.jpg'],
    type: [String]
  })
  fileNames: string[];
}

export class FileUploadUrl {
  @ApiProperty({ description: 'Original filename' })
  fileName: string;

  @ApiProperty({ description: 'Presigned URL for uploading the file' })
  uploadUrl: string;

  @ApiProperty({ description: 'File key in storage' })
  fileKey: string;

  @ApiProperty({ description: 'Public URL that will be accessible after upload' })
  publicUrl: string;
}

export class UploadUrlResponseDto {
  @ApiProperty({
    description: 'Array of upload URLs for each file',
    type: [FileUploadUrl]
  })
  files: FileUploadUrl[];

  @ApiProperty({ description: 'Expiry time in seconds (default: 15 minutes)' })
  expirySeconds: number;
}
