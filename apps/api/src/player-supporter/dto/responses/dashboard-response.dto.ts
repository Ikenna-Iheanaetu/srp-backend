import { ApiProperty } from '@nestjs/swagger';

class DashboardDataDto {
  @ApiProperty({ example: 3 })
  recommendations: number;
}

export class DashboardResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Dashboard fetched successfully' })
  message: string;

  @ApiProperty({ type: DashboardDataDto })
  data: DashboardDataDto;
}
