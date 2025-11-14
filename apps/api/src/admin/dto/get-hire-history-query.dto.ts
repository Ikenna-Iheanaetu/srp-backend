import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetHireHistoryQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  hiredAt: z.string().datetime().optional(),
});

export class GetHireHistoryQueryDto extends createZodDto(GetHireHistoryQuerySchema) {
  @ApiPropertyOptional({
    description: 'Search by player name, company name, or club name',
    example: 'John',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by hire date (ISO 8601 format)',
    example: '2023-12-08',
  })
  hiredAt?: string;
}
