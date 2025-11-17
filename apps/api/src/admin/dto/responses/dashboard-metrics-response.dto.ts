import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class MetricDto {
  @ApiProperty({ example: 5200 })
  current: number;

  @ApiProperty({ example: 4800 })
  previous: number;

  @ApiProperty({ example: 8.33 })
  percentageChange: number;
}

export class DashboardMetricsDto {
  @ApiProperty({ type: MetricDto, description: 'Total revenue from hiring' })
  totalRevenue: MetricDto;

  @ApiProperty({ type: MetricDto, description: 'Total amount invoiced out' })
  totalInvoiced: MetricDto;

  @ApiProperty({ type: MetricDto, description: 'Total company signups' })
  companySignups: MetricDto;

  @ApiProperty({ type: MetricDto, description: 'Total company hires' })
  companyHires: MetricDto;

  @ApiProperty({ type: MetricDto, description: 'Total users' })
  totalUsers: MetricDto;
}

export class GetDashboardMetricsResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Dashboard metrics fetched successfully' })
  declare message: string;

  @ApiProperty({ type: DashboardMetricsDto })
  data: DashboardMetricsDto;
}
