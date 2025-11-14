import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

export enum TransactionType {
  INVOICE = 'invoice',
  WITHDRAWAL = 'withdrawal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

const GetRevenueTransactionsSchema = PaginationQuerySchema.extend({
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class GetRevenueTransactionsDto extends createZodDto(GetRevenueTransactionsSchema) {
  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: TransactionType,
    example: TransactionType.INVOICE,
  })
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.PAID,
  })
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Search by company name or invoice ID',
    example: 'Coastal Warriors',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering transactions (ISO string)',
    example: '2023-12-01T00:00:00.000Z',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering transactions (ISO string)',
    example: '2023-12-31T23:59:59.999Z',
  })
  endDate?: string;
}
