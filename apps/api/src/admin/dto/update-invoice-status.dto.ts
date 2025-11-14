import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { InvoiceStatus } from '@prisma/client';
import { zodEnumTransform } from 'src/common/validators';

const UpdateInvoiceStatusSchema = z.object({
  status: zodEnumTransform(InvoiceStatus) as z.ZodType<InvoiceStatus>,
});

export class UpdateInvoiceStatusDto extends createZodDto(UpdateInvoiceStatusSchema) {
  @ApiProperty({
    description: 'New status for the invoice',
    enum: Object.values(InvoiceStatus).map((v) => v.toLowerCase()),
    example: 'paid',
  })
  status: InvoiceStatus;
}

