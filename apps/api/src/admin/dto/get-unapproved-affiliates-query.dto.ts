import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetUnapprovedAffiliatesQuerySchema = PaginationQuerySchema.extend({
  search: z
    .string()
    .transform((val) => val?.trim())
    .optional(),
  clubId: z.string().optional(),
  invitedAt: z.string().optional(),
});

export class GetUnapprovedAffiliatesQueryDto extends createZodDto(
  GetUnapprovedAffiliatesQuerySchema,
) {
  @ApiPropertyOptional({
    description: 'Search term for email or club name',
    example: 'john@example.com',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Club ID to filter affiliates',
    example: '68c02dec6759f60fe9213820',
  })
  clubId?: string;

  @ApiPropertyOptional({
    description: 'Filter by invitation date',
    example: '2024-01-01',
  })
  invitedAt?: string;
}
