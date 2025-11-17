import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export enum ChartPeriod {
  THIS_MONTH = 'this-month',
  LAST_MONTH = 'last-month',
  THIS_YEAR = 'this-year',
  LAST_YEAR = 'last-year',
  CUSTOM = 'custom',
}

const GetRevenueChartSchema = z.object({
  period: z.nativeEnum(ChartPeriod).default(ChartPeriod.THIS_MONTH).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  months: z.number().default(12).optional(),
});

export class GetRevenueChartDto extends createZodDto(GetRevenueChartSchema) {
  @ApiPropertyOptional({
    description: 'Chart period',
    enum: ChartPeriod,
    example: ChartPeriod.THIS_MONTH,
    default: ChartPeriod.THIS_MONTH,
  })
  period?: ChartPeriod = ChartPeriod.THIS_MONTH;

  @ApiPropertyOptional({
    description: 'Start date for custom period (ISO string)',
    example: '2023-12-01T00:00:00.000Z',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom period (ISO string)',
    example: '2023-12-31T23:59:59.999Z',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of months to include in chart',
    example: 12,
    default: 12,
  })
  months?: number = 12;
}
