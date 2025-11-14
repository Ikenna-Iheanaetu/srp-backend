import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateWithdrawalRequestSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().min(0.01),
  notes: z.string().optional(),
});

export class CreateWithdrawalRequestDto extends createZodDto(CreateWithdrawalRequestSchema) {
  @ApiProperty({
    description: 'Invoice ID for the withdrawal request',
    example: 'INV_0029AC',
  })
  invoiceId: string;

  @ApiProperty({
    description: 'Amount to withdraw',
    example: 500.00,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Additional notes for the withdrawal request',
    example: 'Monthly withdrawal request',
  })
  notes?: string;
}
