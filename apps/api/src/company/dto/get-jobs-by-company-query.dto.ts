import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetJobsByCompanyQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

/**
 * DTO for querying jobs by company
 * Extends PaginationQueryDto to include pagination support
 */
export class GetJobsByCompanyQueryDto extends createZodDto(
  GetJobsByCompanyQuerySchema,
) {
  /**
   * Search term to filter jobs by title, description, or type
   * @example "developer", "manager", "full-time"
   */
  @ApiPropertyOptional({
    description: 'Search term to filter jobs by title, description, or type',
    example: 'developer',
    type: String,
  })
  search?: string;
}
