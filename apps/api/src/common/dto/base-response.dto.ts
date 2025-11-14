import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const MetaSchema = z.object({
  timestamp: z.string(),
  path: z.string(),
  method: z.string(),
  requestId: z.string(),
  version: z.string(),
});

const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  meta: MetaSchema,
});

export class BaseResponseDto extends createZodDto(BaseResponseSchema) {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({
    example: {
      timestamp: '2024-01-01T00:00:00.000Z',
      path: '/api/auth/signup',
      method: 'POST',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      version: 'v1',
    },
  })
  meta: {
    timestamp: string;
    path: string;
    method: string;
    requestId: string;
    version: string;
  };
}

const ErrorSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  meta: MetaSchema,
  errors: z.array(ErrorSchema).optional(),
});

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {
  @ApiProperty({ example: false })
  success: false;

  @ApiProperty({ example: 'Operation not completed successfully' })
  message: string;

  @ApiProperty({
    example: {
      timestamp: '2024-01-01T00:00:00.000Z',
      path: '/api/auth/signup',
      method: 'POST',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      version: 'v1',
    },
  })
  meta: {
    timestamp: string;
    path: string;
    method: string;
    requestId: string;
    version: string;
  };

  @ApiProperty({
    example: [
      {
        field: 'email',
        message: 'Email is already taken',
        code: 'DUPLICATE_VALUE',
      },
    ],
    required: false,
  })
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}
