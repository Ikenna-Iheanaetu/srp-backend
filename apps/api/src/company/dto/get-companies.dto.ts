import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodEnumTransform } from 'src/common/validators';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

const GetCompaniesSchema = PaginationQuerySchema.extend({
  status: zodEnumTransform(UserStatus).optional(),
  search: z.string().optional(),
});

export class GetCompaniesDto extends createZodDto(GetCompaniesSchema) {
  @ApiPropertyOptional({
    enum: Object.values(UserStatus).map((v) => v.toLowerCase()),
    example: 'active',
    description: 'Filter by user status',
  })
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'acme' })
  search?: string;
}
