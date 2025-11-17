import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class DashboardMetricDto {
  @ApiProperty({ example: 'jobsPosting' })
  accessorKey: string;

  @ApiProperty({ example: 5 })
  value: number;

  @ApiProperty({ example: 'Active Job Posting' })
  title: string;
}

export class DashboardApplicantDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'Software Engineer' })
  application: string;

  @ApiProperty({ example: 'applied' })
  status: string;

  @ApiProperty({ example: '2023-12-01T10:00:00.000Z' })
  date: string;
}

export class RecruitmentGoalsDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 3 })
  achieved: number;
}

export class DashboardDataDto {
  @ApiProperty({ example: 2 })
  pendingTasks: number;

  @ApiProperty({ type: RecruitmentGoalsDto })
  recruitmentGoals: RecruitmentGoalsDto;

  @ApiProperty({ type: [DashboardMetricDto] })
  metrics: DashboardMetricDto[];

  @ApiProperty({ type: [DashboardApplicantDto] })
  applicants: DashboardApplicantDto[];
}

export class DashboardResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Dashboard data fetched successfully' })
  declare message: string;

  @ApiProperty({ type: DashboardDataDto })
  data: DashboardDataDto;
}
