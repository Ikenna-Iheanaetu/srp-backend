import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';
import { zodQueryArray, zodQueryArrayToUppercase } from 'src/common/validators';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetJobsByPlayerSchema = PaginationQuerySchema.extend({
  workTypes: zodQueryArrayToUppercase(EmploymentType).optional(),
  search: z.string().optional(),
  industry: zodQueryArray(z.string()).optional(),
  regions: zodQueryArray(z.string()).optional(),
});

export class GetJobsByPlayerDto extends createZodDto(GetJobsByPlayerSchema) {
  @ApiProperty({
    description:
      'Work types to filter by. Use ?workTypes[]=full_time&workTypes[]=part_time',
    example: ['full_time', 'part_time'],
    enum: Object.values(EmploymentType).map((v) => v.toLowerCase()),
    isArray: true,
    required: false,
  })
  workTypes?: EmploymentType[];

  @ApiProperty({
    description: 'Search term for job title, description, or tags',
    example: 'software engineer',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: 'Industries to filter by. Use ?industry[]=technology&industry[]=finance',
    example: ['technology', 'finance'],
    type: [String],
    required: false,
  })
  industry?: string[];

  @ApiProperty({
    description: 'Regions to filter by. Use ?regions[]=North%20America&regions[]=Europe',
    example: ['North America', 'Europe'],
    type: [String],
    required: false,
  })
  regions?: string[];

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number;
}
