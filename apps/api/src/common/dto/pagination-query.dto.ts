import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodInteger } from '../validators';

export const PaginationQuerySchema = z.object({
  page: zodInteger(z.number().int().min(1)).default(1).optional(),
  limit: zodInteger(z.number().int().min(1)).default(10).optional(),
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {
  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number;
}
