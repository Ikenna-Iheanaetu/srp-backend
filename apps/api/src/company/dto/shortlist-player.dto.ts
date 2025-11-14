import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodMongoId } from 'src/common/validators';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const ShortlistPlayerSchema = z.object({
  candidate: zodMongoId(),
  jobs: z.array(zodMongoId()),
});

export class ShortlistPlayerDto extends createZodDto(ShortlistPlayerSchema) {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Player/candidate ID',
  })
  candidate: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    description: 'Array of job IDs',
  })
  jobs: string[];
}

const GetShortlistedPlayersQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export class GetShortlistedPlayersQueryDto extends createZodDto(
  GetShortlistedPlayersQuerySchema,
) {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Search term for player name',
  })
  search?: string;
}

const GetHiredPlayersQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export class GetHiredPlayersQueryDto extends createZodDto(
  GetHiredPlayersQuerySchema,
) {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Search term for player name',
  })
  search?: string;
}
