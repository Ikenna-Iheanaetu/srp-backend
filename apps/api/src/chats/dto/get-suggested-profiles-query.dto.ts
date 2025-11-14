import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetSuggestedProfilesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export class GetSuggestedProfilesQueryDto extends createZodDto(GetSuggestedProfilesQuerySchema) {
  @ApiPropertyOptional({
    description: 'Search by name (partial match)',
    example: 'John',
  })
  search?: string;
}
