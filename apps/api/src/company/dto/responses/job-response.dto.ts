import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class JobDataDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820', description: 'Job ID' })
  id: string;

  @ApiProperty({ example: 'Software Engineer', description: 'Job title' })
  title: string;

  @ApiProperty({ example: 'We are looking for a skilled software engineer...', description: 'Job description' })
  description: string;

  @ApiProperty({ example: 'full-time', description: 'Job type' })
  type: string;

  @ApiProperty({ example: ['JavaScript', 'React', 'Node.js'], description: 'Required skills' })
  skills: string[];

  @ApiProperty({ example: ['remote', 'flexible'], description: 'Job tags' })
  tags: string[];

  @ApiProperty({ example: 'New York, NY', description: 'Job location' })
  location: string;

  @ApiProperty({ example: { min: 50000, max: 80000, currency: 'USD', frequency: 'annual' }, description: 'Salary information' })
  salary: {
    min?: number;
    max?: number;
    currency?: string;
    frequency?: string;
  };

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', description: 'Application deadline' })
  deadline: string;

  @ApiProperty({ example: '3-5 years experience required', description: 'Experience requirements' })
  experience: string;

  @ApiProperty({ example: 'Bachelor\'s degree in Computer Science', description: 'Education requirements' })
  education: string;

  @ApiProperty({ example: 'active', description: 'Job status' })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Job creation date' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-20T15:45:00.000Z', description: 'Job last update date' })
  updatedAt: string;

  @ApiProperty({ example: 'from_posted', description: 'Draft origin (never_posted or from_posted)', enum: ['never_posted', 'from_posted'], nullable: true })
  draftOrigin?: string;

  @ApiProperty({ example: '2024-01-20T15:45:00.000Z', description: 'Date when job was drafted', nullable: true })
  draftedAt?: string;
}

export class JobResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Job fetched successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: JobDataDto, description: 'Job data' })
  data: JobDataDto;
}

export class JobsDataDto {
  @ApiProperty({ type: [JobDataDto], description: 'Array of jobs' })
  data: JobDataDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}

export class JobsResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Jobs fetched successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: JobsDataDto, description: 'Jobs data with pagination' })
  data: JobsDataDto;
}

export class DeleteJobResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Job deleted successfully', description: 'Response message' })
  message: string;
}
