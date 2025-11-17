import { ApiProperty } from '@nestjs/swagger';

class CompanySnippetDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Tech Corp' })
  name: string;

  @ApiProperty({ example: 'TECHNOLOGY' })
  industry: string;

  @ApiProperty({ example: '123 Tech St' })
  address: string;

  @ApiProperty({ example: 'USA' })
  region: string;

  @ApiProperty({ example: 'https://cdn/avatar.png' })
  avatar: string;
}

export class SingleJobDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ example: 'full_time' })
  type: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'Remote' })
  location: string;

  @ApiProperty({ type: [String], example: ['react', 'typescript'] })
  tags: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ type: CompanySnippetDto })
  company: CompanySnippetDto;

  @ApiProperty({ example: true })
  isBookmarked: boolean;

  @ApiProperty({
    example: 'not_applied',
    enum: ['not_applied', 'applied', 'shortlisted', 'hired', 'rejected'],
  })
  applicationStatus: string;
}

export class GetSingleJobResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Job fetched successfully' })
  message: string;

  @ApiProperty({ type: SingleJobDataDto })
  data: SingleJobDataDto;
}
