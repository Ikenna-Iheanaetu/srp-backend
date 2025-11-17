import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetPublicClubsSchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export class GetPublicClubsDto extends createZodDto(GetPublicClubsSchema) {
  @ApiPropertyOptional({
    example: 'Manchester',
    description: 'Search clubs by name',
  })
  search?: string;
}
