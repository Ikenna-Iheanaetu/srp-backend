import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { InvoiceItemDto } from './invoices-response.dto';

export class ExportInvoicesResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Invoices exported successfully' })
  declare message: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  data: InvoiceItemDto[];
}
