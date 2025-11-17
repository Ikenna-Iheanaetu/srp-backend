import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { MetricDto } from './dashboard-metrics-response.dto';
import { HireHistoryItemDto } from './hire-history-response.dto';
import { NewCompanyItemDto } from './new-companies-response.dto';

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

export class DashboardDataDto {
  @ApiProperty({ type: DashboardMetricsDto })
  metrics: DashboardMetricsDto;

  @ApiProperty({ type: [HireHistoryItemDto] })
  hireHistory: HireHistoryItemDto[];

  @ApiProperty({ type: [NewCompanyItemDto] })
  newCompanies: NewCompanyItemDto[];
}

export class GetDashboardResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Dashboard data fetched successfully' })
  declare message: string;

  @ApiProperty({ type: DashboardDataDto })
  data: DashboardDataDto;
}

