import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PaginationMetaSchema = z.object({
  total: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
});

export class PaginationMetaDto extends createZodDto(PaginationMetaSchema) {
  @ApiProperty({ example: 127 })
  total: number;

  @ApiProperty({ example: 13 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

// Wrapper type for responses that include pagination metadata
export type PaginationMetaResponse = {
  meta: PaginationMetaDto;
};
