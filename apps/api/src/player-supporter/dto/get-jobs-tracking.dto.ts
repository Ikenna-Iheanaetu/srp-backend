import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { ApplicationStatus } from '@prisma/client';
import { zodQueryArrayToUppercase } from 'src/common/validators';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetJobsTrackingSchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  applicationStatus: zodQueryArrayToUppercase(ApplicationStatus).optional(),
});

export class GetJobsTrackingDto extends createZodDto(GetJobsTrackingSchema) {
  @ApiProperty({
    description: 'Search term for job title',
    example: 'software engineer',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description:
      'Filter by application status. Use ?applicationStatus[]=applied&applicationStatus[]=shortlisted',
    example: ['applied', 'shortlisted'],
    enum: Object.values(ApplicationStatus).map((v) => v.toLowerCase()),
    isArray: true,
    required: false,
  })
  applicationStatus?: ApplicationStatus[];

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number;
}
