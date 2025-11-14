import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class CompanyInfoDto {
  @ApiProperty({ example: '68cd72da06ed994b3162598b' })
  id: string;

  @ApiProperty({ example: 'TechCorp 5' })
  name: string;

  @ApiProperty({ example: 'Retail' })
  industry: string;

  @ApiProperty({ example: '2005 Business Blvd, Tech City 5' })
  address: string;

  @ApiProperty({ example: 'France' })
  region: string;

  @ApiProperty({
    example: 'https://ui-avatars.com/api/?name=Tech5&background=random',
  })
  avatar: string;
}

export class JobItemResponseDto {
  @ApiProperty({ example: '68cd730706ed994b316259e6' })
  id: string;

  @ApiProperty({ example: 'Leadership Specialist' })
  title: string;

  @ApiProperty({
    example:
      'We are looking for an experienced Leadership professional to join our growing team.',
  })
  description: string;

  @ApiProperty({ example: 'full_time' })
  type: string;

  @ApiProperty({ example: 'Australia, Remote Available' })
  location: string;

  @ApiProperty({ example: ['remote-friendly'] })
  tags: string[];

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2025-09-19T15:13:11.237Z' })
  createdAt: string;

  @ApiProperty({ type: CompanyInfoDto })
  company: CompanyInfoDto;

  @ApiProperty({ example: false })
  isBookmarked: boolean;

  @ApiProperty({
    example: 'not_applied',
    description:
      'Application status: not_applied, applied, shortlisted, hired, rejected',
  })
  applicationStatus: string;
}

class GetJobsByPlayerDataDto {
  @ApiProperty({
    description: 'Array of job items',
    type: [JobItemResponseDto],
  })
  data: JobItemResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

export class GetJobsByPlayerResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Jobs fetched successfully' })
  declare message: string;

  @ApiProperty({ type: GetJobsByPlayerDataDto })
  data: GetJobsByPlayerDataDto;
}
