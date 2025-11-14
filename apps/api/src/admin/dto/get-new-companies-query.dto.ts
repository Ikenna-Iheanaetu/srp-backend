import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { UserStatus } from '@prisma/client';
import { zodEnumTransform } from 'src/common/validators';

const GetNewCompaniesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  signupDate: z.string().datetime().optional(),
  status: zodEnumTransform(UserStatus).optional() as z.ZodOptional<z.ZodType<UserStatus>>,
});

export class GetNewCompaniesQueryDto extends createZodDto(GetNewCompaniesQuerySchema) {
  @ApiPropertyOptional({
    description: 'Search by company name',
    example: 'Elite Match',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by signup date (ISO 8601 format)',
    example: '2023-12-08',
  })
  signupDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by approval status',
    enum: Object.values(UserStatus).map((v) => v.toLowerCase()),
    example: 'pending',
  })
  status?: UserStatus;
}
