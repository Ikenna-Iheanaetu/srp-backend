import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class InvoiceStatsData {
  @ApiProperty({ example: 50, description: 'Total number of paid invoices' })
  paidCount: number;

  @ApiProperty({
    example: 12,
    description: 'Total number of pending invoices',
  })
  pendingCount: number;

  @ApiProperty({
    example: 62,
    description: 'Total number of invoices',
  })
  totalCount: number;
}

export class GetInvoiceStatsResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Invoice statistics fetched successfully' })
  declare message: string;

  @ApiProperty({ type: InvoiceStatsData })
  data: InvoiceStatsData;
}
