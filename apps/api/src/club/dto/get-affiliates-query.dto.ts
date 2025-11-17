import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AffiliateStatus, AffiliateType } from '@prisma/client';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { zodQueryArrayToUppercase } from 'src/common/validators';

const GetAffiliatesSchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  affiliateTypes: zodQueryArrayToUppercase(AffiliateType).optional(),
  status: zodQueryArrayToUppercase(AffiliateStatus).optional(),
});

export class GetAffiliatesDto extends createZodDto(GetAffiliatesSchema) {
  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Search by email or name',
  })
  search?: string;

  @ApiPropertyOptional({
    enum: Object.values(AffiliateType).map((v) => v.toLowerCase()),
    isArray: true,
    example: ['player', 'company'],
    description:
      'Filter by affiliate types. Use ?affiliateTypes[]=player&affiliateTypes[]=company',
  })
  affiliateTypes?: AffiliateType[];

  @ApiPropertyOptional({
    enum: Object.values(AffiliateStatus).map((v) => v.toLowerCase()),
    isArray: true,
    example: ['active', 'pending'],
    description:
      'Filter by affiliate status. Use ?status[]=active&status[]=pending',
  })
  status?: AffiliateStatus[];
}