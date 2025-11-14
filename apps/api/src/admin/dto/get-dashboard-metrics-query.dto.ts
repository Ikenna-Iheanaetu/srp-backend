import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodEnumTransform } from 'src/common/validators';

export enum MetricsPeriod {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_WEEK = 'LAST_WEEK',
  LAST_MONTH = 'LAST_MONTH',
  LAST_YEAR = 'LAST_YEAR',
}

const GetDashboardMetricsQuerySchema = z.object({
  period: zodEnumTransform(MetricsPeriod).default(MetricsPeriod.LAST_WEEK).optional() as z.ZodOptional<z.ZodType<MetricsPeriod>>,
});

export class GetDashboardMetricsQueryDto extends createZodDto(GetDashboardMetricsQuerySchema) {
  @ApiPropertyOptional({
    description: 'Period for metrics',
    enum: Object.values(MetricsPeriod).map((v) => v.toLowerCase()),
    example: 'last_week',
    default: 'last_week',
  })
  period?: MetricsPeriod = MetricsPeriod.LAST_WEEK;
}
