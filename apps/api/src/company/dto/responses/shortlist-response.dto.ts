import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class ShortlistPlayerResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Candidate shortlisted successfully' })
  declare message: string;

  @ApiPropertyOptional({ example: ['507f1f77bcf86cd799439011'] })
  invalidJobs?: string[];

  @ApiPropertyOptional({ example: ['507f1f77bcf86cd799439012'] })
  alreadyShortlistedJobs?: string[];
}

export class RemovePlayerResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Candidate removed from shortlist successfully' })
  declare message: string;

  @ApiPropertyOptional({ example: ['507f1f77bcf86cd799439011'] })
  invalidJobs?: string[];

  @ApiPropertyOptional({ example: ['507f1f77bcf86cd799439012'] })
  notShortlistedJobs?: string[];
}

export class JobWithShortlistedDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Software Engineer' })
  title: string;

  @ApiProperty({ example: 'Full-time software development position' })
  description: string;

  @ApiProperty({ example: 'New York, NY' })
  location: string;

  @ApiProperty({ example: 'FULL_TIME' })
  type: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 3 })
  shortlistedCount: number;

  @ApiProperty({ example: ['avatar1.png', 'avatar2.png'] })
  shortlistedAvatars: string[];

  @ApiProperty({ example: '2023-12-01T10:00:00.000Z' })
  createdAt: string;
}

export class ShortlistedPlayerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'https://cdn.example.com/avatar.png' })
  avatar: string;

  @ApiProperty({ example: '2023-12-01T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 'https://cdn.example.com/resume.pdf' })
  resume: string;

  @ApiProperty({ example: 'player' })
  userType: string;
}

export class JobsWithShortlistedDataDto {
  @ApiProperty({ type: [JobWithShortlistedDto] })
  data: JobWithShortlistedDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class JobsWithShortlistedResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Jobs with shortlisted players fetched successfully' })
  declare message: string;

  @ApiProperty({ type: JobsWithShortlistedDataDto })
  data: JobsWithShortlistedDataDto;
}

export class ShortlistedPlayersDataDto {
  @ApiProperty({ type: [ShortlistedPlayerDto] })
  data: ShortlistedPlayerDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class ShortlistedPlayersResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Shortlisted players fetched successfully' })
  declare message: string;

  @ApiProperty({ type: ShortlistedPlayersDataDto })
  data: ShortlistedPlayersDataDto;
}

export class HireCandidateResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Candidate hired successfully' })
  declare message: string;
}

export class UnhireCandidateResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Candidate unhired successfully' })
  declare message: string;
}

export class RemoveAllShortlistedResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'All shortlisted candidates removed successfully' })
  declare message: string;
}
