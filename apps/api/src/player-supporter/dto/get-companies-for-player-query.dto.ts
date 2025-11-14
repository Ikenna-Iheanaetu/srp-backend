import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetCompaniesForPlayerQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export class GetCompaniesForPlayerQueryDto extends createZodDto(
  GetCompaniesForPlayerQuerySchema,
) {
  @ApiPropertyOptional({
    description: 'Search term to filter companies by name or description',
    example: 'tech',
    type: String,
  })
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number;
}
