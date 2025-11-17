import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class CompanyTrackingDto {
  @ApiProperty({ example: '68cd72da06ed994b3162598b' })
  id: string;

  @ApiProperty({ example: 'TechCorp Inc' })
  name: string;

  @ApiProperty({ example: 'Technology' })
  industry: string;

  @ApiProperty({ example: 'San Francisco, CA' })
  location: string;

  @ApiProperty({
    example: 'https://ui-avatars.com/api/?name=TechCorp&background=random',
  })
  avatar: string;
}

export class JobTrackingItemDto {
  @ApiProperty({ example: '68cd730706ed994b316259e6' })
  id: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  title: string;

  @ApiProperty({ example: 'full_time' })
  type: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({
    example: 'applied',
    description: 'Application status in lowercase for frontend consistency',
  })
  applicationStatus: string;

  @ApiProperty({ type: CompanyTrackingDto })
  company: CompanyTrackingDto;
}

class GetJobsTrackingDataDto {
  @ApiProperty({
    description: 'Array of tracked job items',
    type: [JobTrackingItemDto],
  })
  data: JobTrackingItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

export class GetJobsTrackingResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Job tracking data fetched successfully' })
  declare message: string;

  @ApiProperty({ type: GetJobsTrackingDataDto })
  data: GetJobsTrackingDataDto;
}
