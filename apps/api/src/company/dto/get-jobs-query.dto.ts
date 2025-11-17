import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { zodQueryArray } from 'src/common/validators';

const DateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const GetJobsQuerySchema = PaginationQuerySchema.extend({
  status: zodQueryArray(z.string())
    .transform((arr) => {
      if (!arr) return undefined;
      return arr.map((v) => (typeof v === 'string' ? v.toUpperCase() : v));
    })
    .refine(
      (arr) => {
        if (!arr) return true;
        return arr.every((v) => ['ACTIVE', 'DRAFTED'].includes(v));
      },
      { message: 'Status must be one of: ACTIVE, DRAFTED' },
    )
    .optional(),
  search: z.string().optional(),
  createdAt: zodQueryArray(z.string().datetime()).optional(),
  draftOrigin: zodQueryArray(z.string())
    .refine(
      (arr) => {
        if (!arr) return true;
        return arr.every((v) => ['from_posted', 'never_posted'].includes(v));
      },
      { message: 'Draft origin must be one of: from_posted, never_posted' },
    )
    .optional(),
  draftedAt: zodQueryArray(z.string().datetime()).optional(),
});

export class DateRangeDto extends createZodDto(DateRangeSchema) {
  @ApiPropertyOptional({ example: '2023-01-01T00:00:00.000Z' })
  from?: string;

  @ApiPropertyOptional({ example: '2023-12-31T23:59:59.999Z' })
  to?: string;
}

export class GetJobsQueryDto extends createZodDto(GetJobsQuerySchema) {
  @ApiPropertyOptional({
    example: ['active', 'draft'],
    description:
      'Job status filter. Accepts both single values and arrays. Case-insensitive. Supports both ?status=value and ?status[]=value notation.',
  })
  status?: string[];

  @ApiPropertyOptional({
    example: 'software engineer',
    description: 'Search term for job title, description, etc.',
  })
  search?: string;

  @ApiPropertyOptional({
    example: ['2023-01-01T00:00:00.000Z', '2023-12-31T23:59:59.999Z'],
    description:
      'Date range filter array format [from, to]. Accepts both single values and arrays. Supports both ?createdAt=value and ?createdAt[]=value notation.',
  })
  createdAt?: string[];

  @ApiPropertyOptional({
    example: ['from_posted', 'never_posted'],
    description:
      'Draft origin filter. Accepts both single values and arrays. Supports both ?draftOrigin=value and ?draftOrigin[]=value notation.',
    enum: ['from_posted', 'never_posted'],
  })
  draftOrigin?: string[];

  @ApiPropertyOptional({
    example: ['2023-01-01T00:00:00.000Z', '2023-12-31T23:59:59.999Z'],
    description:
      'Drafted date range filter array format [from, to]. Accepts both single values and arrays. Supports both ?draftedAt=value and ?draftedAt[]=value notation.',
  })
  draftedAt?: string[];
}
