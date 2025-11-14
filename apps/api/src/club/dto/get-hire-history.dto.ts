import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

export enum HireHistoryStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

const GetHireHistorySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(HireHistoryStatus).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  companyId: z.string().optional(),
});

export class GetHireHistoryDto extends createZodDto(GetHireHistorySchema) {
  @ApiPropertyOptional({
    description: 'Filter by hire status',
    enum: HireHistoryStatus,
    example: HireHistoryStatus.COMPLETED,
  })
  status?: HireHistoryStatus;

  @ApiPropertyOptional({
    description: 'Search by athlete name or company name',
    example: 'John Smith',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Start date filter (ISO string)',
    example: '2023-01-01T00:00:00.000Z',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (ISO string)',
    example: '2023-12-31T23:59:59.999Z',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by company ID',
    example: 'company-uuid-here',
  })
  companyId?: string;
}
