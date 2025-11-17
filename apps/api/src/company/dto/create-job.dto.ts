import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, JobStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  zodBoolean,
  zodJsonString,
  zodStringArray,
} from 'src/common/validators';

const SalarySchema = z.object({
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  currency: z.string().optional(),
  frequency: z.string().optional(),
});

export class SalaryDto extends createZodDto(SalarySchema) {
  @ApiPropertyOptional({ example: 50000, description: 'Minimum salary' })
  min?: number;

  @ApiPropertyOptional({ example: 80000, description: 'Maximum salary' })
  max?: number;

  @ApiPropertyOptional({ example: 'USD', description: 'Currency code' })
  currency?: string;

  @ApiPropertyOptional({ example: 'annual', description: 'Payment frequency' })
  frequency?: string;
}

export const CreateJobSchema = z.object({
  title: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  type: z
    .string()
    .transform((v) => v?.toUpperCase().replace(/-/g, '_'))
    .refine((v) => Object.values(EmploymentType).includes(v as EmploymentType))
    .optional(),
  skills: zodStringArray(z.string()).optional(),
  responsibilities: zodStringArray(z.string()).optional(),
  qualifications: zodStringArray(z.string()).optional(),
  traits: zodStringArray(z.string()).optional(),
  tags: zodStringArray(z.string()).optional(),
  location: z.string().optional(),
  salary: zodJsonString(SalarySchema).optional(),
  startDate: z.string().datetime().optional(),
  openToAll: zodBoolean().optional(),
  status: z
    .string()
    .transform((v) => {
      // Handle "drafted" as alias for "draft"
      const normalized = v?.toLowerCase();
      if (normalized === 'drafted' || normalized === 'draft') {
        return JobStatus.DRAFT;
      }
      return v?.toUpperCase();
    })
    .refine((v) => Object.values(JobStatus).includes(v as JobStatus), {
      message: 'Status must be one of: draft or active',
    })
    .optional(),
});

export class CreateJobDto extends createZodDto(CreateJobSchema) {
  @ApiProperty({ example: 'Software Engineer', description: 'Job title' })
  title: string;

  @ApiProperty({
    example: 'Software Engineer',
    description: 'Job role/category',
  })
  role: string;

  @ApiProperty({
    example: 'We are looking for a skilled software engineer...',
    description: 'Job description',
  })
  description: string;

  @ApiPropertyOptional({
    example: 'full_time',
    description: 'Job type',
    enum: Object.values(EmploymentType).map((v) => v.toLowerCase()),
  })
  type?: EmploymentType;

  @ApiPropertyOptional({
    example: ['JavaScript', 'React', 'Node.js'],
    description: 'Required skills',
  })
  skills?: string[];

  @ApiPropertyOptional({
    example: ['Own feature X', 'Support Y'],
    description: 'Job responsibilities',
  })
  responsibilities?: string[];

  @ApiPropertyOptional({
    example: ['BSc CS', '3+ years'],
    description: 'Job qualifications',
  })
  qualifications?: string[];

  @ApiPropertyOptional({
    example: ['Team player', 'Leadership'],
    description: 'Desired traits',
  })
  traits?: string[];

  @ApiPropertyOptional({
    example: ['remote', 'flexible'],
    description: 'Job tags',
  })
  tags?: string[];

  @ApiPropertyOptional({ example: 'New York, NY', description: 'Job location' })
  location?: string;

  @ApiPropertyOptional({ type: SalaryDto, description: 'Salary information' })
  salary?: SalaryDto;

  @ApiPropertyOptional({
    example: '2025-09-29T23:00:00.000Z',
    description: 'Job start date (ISO string)',
  })
  startDate?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether job is open to all',
  })
  openToAll?: boolean;

  @ApiPropertyOptional({
    example: 'draft',
    description: 'Job status (draft or active)',
    enum: ['draft', 'active'],
  })
  status?: JobStatus;
}
