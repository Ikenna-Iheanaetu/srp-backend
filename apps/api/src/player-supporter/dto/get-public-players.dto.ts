import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetPublicPlayersSchema = z.object({
  search: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export class GetPublicPlayersDto extends createZodDto(GetPublicPlayersSchema) {
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number;
}
