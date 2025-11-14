import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { InvoiceStatus } from '@prisma/client';
import { zodEnumTransform } from 'src/common/validators';

export enum InvoiceTab {
  COMPANY = 'COMPANY',
  CLUB = 'CLUB',
}

const GetInvoicesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  invoiceDate: z.string().datetime().optional(),
  status: zodEnumTransform(InvoiceStatus).optional() as z.ZodOptional<z.ZodType<InvoiceStatus>>,
  tab: zodEnumTransform(InvoiceTab).default(InvoiceTab.COMPANY).optional() as z.ZodOptional<z.ZodType<InvoiceTab>>,
});

export class GetInvoicesQueryDto extends createZodDto(GetInvoicesQuerySchema) {
  @ApiPropertyOptional({
    description: 'Search by player name, company name, or invoice code',
    example: 'Alex',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice date (ISO 8601 format)',
    example: '2023-12-08',
  })
  invoiceDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice status',
    enum: Object.values(InvoiceStatus).map((v) => v.toLowerCase()),
    example: 'paid',
  })
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Filter by tab (company or club)',
    enum: Object.values(InvoiceTab).map((v) => v.toLowerCase()),
    example: 'company',
    default: 'company',
  })
  tab?: InvoiceTab = InvoiceTab.COMPANY;
}
