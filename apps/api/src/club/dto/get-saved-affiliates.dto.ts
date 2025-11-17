import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { AffiliateType } from '@prisma/client';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { zodQueryArrayToUppercase } from 'src/common/validators';

const GetSavedAffiliatesSchema = PaginationQuerySchema.extend({
  affiliateTypes: zodQueryArrayToUppercase(AffiliateType).optional(),
});

export class GetSavedAffiliatesDto extends createZodDto(
  GetSavedAffiliatesSchema,
) {
  @ApiPropertyOptional({
    enum: Object.values(AffiliateType).map((v) => v.toLowerCase()),
    isArray: true,
    example: ['player', 'company'],
    description: 'Filter by affiliate types',
  })
  affiliateTypes?: AffiliateType[];
}