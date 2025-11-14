import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { zodQueryArrayToUppercase } from 'src/common/validators';
import { JobStatus } from '@prisma/client';

const GetJobsWithShortlistedQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  status: zodQueryArrayToUppercase(JobStatus).optional(),
});

export class GetJobsWithShortlistedQueryDto extends createZodDto(
  GetJobsWithShortlistedQuerySchema,
) {
  @ApiPropertyOptional({
    example: 'software engineer',
    description: 'Search term for job title, description, etc.',
  })
  search?: string;

  @ApiPropertyOptional({
    example: ['active', 'draft', 'inactive'],
    description:
      'Job status filter (active, draft, or inactive). Accepts both single values and arrays. Values are transformed to uppercase. Supports both ?status=value and ?status[]=value notation.',
    enum: ['active', 'draft', 'inactive'],
  })
  status?: string[];
}
