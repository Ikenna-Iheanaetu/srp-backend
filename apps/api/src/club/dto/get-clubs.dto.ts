import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetClubsSchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export class GetClubsDto extends createZodDto(GetClubsSchema) {
  @ApiPropertyOptional({ example: 'Sports Club', description: 'Search term' })
  search?: string;
}
