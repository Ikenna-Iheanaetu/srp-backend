import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetUnclaimedAffiliatesQuerySchema = PaginationQuerySchema.extend({
  search: z
    .string()
    .transform((val) => val?.trim())
    .optional(),
  invitedAt: z.string().optional(),
});

export class GetUnclaimedAffiliatesQueryDto extends createZodDto(
  GetUnclaimedAffiliatesQuerySchema,
) {
  @ApiPropertyOptional({
    description: 'Search term for email or club name',
    example: 'john@example.com',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by invitation date',
    example: '2024-01-01',
  })
  invitedAt?: string;
}
