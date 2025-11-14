import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetHiredJobsQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export class GetHiredJobsQueryDto extends createZodDto(GetHiredJobsQuerySchema) {
  @ApiPropertyOptional({
    example: 'software engineer',
    description: 'Search term for job title, description, or type',
  })
  search?: string;
}
