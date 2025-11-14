import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class InvoiceItemDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

  @ApiProperty({ example: 'Alex Johnson' })
  playerName: string;

  @ApiProperty({ example: 'alex.johnson@example.com' })
  playerEmail: string;

  @ApiProperty({ example: 'Coastal Warriors' })
  companyName: string;

  @ApiProperty({ example: '68c02dec6759f60fe9213821' })
  companyId: string;

  @ApiProperty({ example: 'Ocean Defenders' })
  clubName: string;

  @ApiProperty({ example: '68c02dec6759f60fe9213822' })
  clubId: string;

  @ApiProperty({ example: 'https://via.placeholder.com/150' })
  clubAvatar: string;

  @ApiProperty({ example: 'INV_0029AC' })
  invoiceCode: string;

  @ApiProperty({ example: '68c02dec6759f60fe9213823' })
  invoiceId: string;

  @ApiProperty({ example: 100.0, description: '30% of total invoice amount' })
  amount: number;

  @ApiProperty({ example: '2023-12-08' })
  invoiceDate: string;

  @ApiProperty({ example: 'PAID', enum: ['PAID', 'PENDING', 'OVERDUE', 'CANCELLED'] })
  status: string;
}

export class InvoicesDataDto {
  @ApiProperty({ type: [InvoiceItemDto] })
  data: InvoiceItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class GetInvoicesResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Invoices fetched successfully' })
  declare message: string;

  @ApiProperty({ type: InvoicesDataDto })
  data: InvoicesDataDto;
}
