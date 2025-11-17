import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AffiliateStatus, AffiliateType } from '@prisma/client';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { zodEnumTransform, zodMongoId } from 'src/common/validators';

const GetAffiliatesSchema = PaginationQuerySchema.extend({
  status: zodEnumTransform(AffiliateStatus).optional(),
  search: z.string().optional(),
  clubId: zodMongoId().optional(),
  type: zodEnumTransform(AffiliateType).optional(),
});

export class GetAffiliatesDto extends createZodDto(GetAffiliatesSchema) {
  @ApiPropertyOptional({
    description: 'Filter by affiliate status',
    enum: Object.values(AffiliateStatus).map((v) => v.toLowerCase()),
    example: 'active',
  })
  status?: AffiliateStatus;

  @ApiPropertyOptional({
    description: 'Search in affiliate names',
    example: 'John Doe',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by club ID',
    example: '68c02dec6759f60fe9213820',
  })
  clubId?: string;

  @ApiPropertyOptional({
    description: 'Filter by affiliate type',
    enum: Object.values(AffiliateType).map((v) => v.toLowerCase()),
    example: 'player',
  })
  type?: AffiliateType;
}
