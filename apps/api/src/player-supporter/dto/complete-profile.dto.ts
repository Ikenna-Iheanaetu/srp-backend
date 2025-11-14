import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  zodBoolean,
  zodInteger,
  zodJsonString,
  zodStringArray,
} from 'src/common/validators';

const EmploymentTypeSchema = z.object({
  primary: z
    .union([
      z.string().min(1).transform((v) => v?.toUpperCase().replace(/-/g, '_')).refine(
        (v) => Object.values(EmploymentType).includes(v as EmploymentType),
        { message: 'Invalid employment type' }
      ),
      z.literal(''),
    ])
    .optional(),
  secondary: z
    .array(z.string().min(1))
    .transform((arr) => arr.map((v) => v?.toUpperCase().replace(/-/g, '_')))
    .refine(
      (arr) => arr.every((v) => Object.values(EmploymentType).includes(v as EmploymentType)),
      { message: 'Invalid employment type in secondary' }
    )
    .optional(),
});

const JobRoleSchema = z.object({
  primary: z.string().optional(),
  secondary: z.array(z.string()).optional(),
});

const ExperienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  current: zodBoolean().optional(),
  remote: zodBoolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().optional(),
  skills: zodStringArray(z.string()).optional(),
  tools: zodStringArray(z.string()).optional(),
  responsibilities: zodStringArray(z.string()).pipe(z.array(z.string()).max(7)).optional(),
});

export class ExperienceDto extends createZodDto(ExperienceSchema) {
  @ApiProperty({ example: 'Software Engineer' })
  title: string;

  @ApiProperty({ example: 'TechCorp Inc.' })
  company: string;

  @ApiPropertyOptional({ example: true })
  current?: boolean;

  @ApiPropertyOptional({ example: false })
  remote?: boolean;

  @ApiPropertyOptional({ example: '2023-01-15' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  endDate?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  companyPhone?: string;

  @ApiPropertyOptional({ example: 'hr@techcorp.com' })
  companyEmail?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['JavaScript', 'TypeScript'],
  })
  skills?: string[];

  @ApiPropertyOptional({ type: [String], example: ['VS Code', 'Docker'] })
  tools?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Code reviews', 'Team leadership'],
    maxItems: 7,
  })
  responsibilities?: string[];
}

export const CompleteProfileSchema = z.object({
  step: zodInteger(z.number().int().min(1).max(3)),
  // Step 1 fields
  about: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  shirtNumber: zodInteger(z.number().int().min(1).max(99)).optional(),
  birthYear: zodInteger(z.number().int().min(1950).max(2010)).optional(),
  sportsHistory: z.string().optional(),
  industry: z.string().optional(),
  yearsOfExperience: zodInteger(z.number().int().min(0).max(50)).optional(),
  // Step 2 fields
  workLocations: zodStringArray(z.string()).pipe(z.array(z.string()).max(5)).optional(),
  employmentType: zodJsonString(EmploymentTypeSchema).optional(),
  jobRole: zodJsonString(JobRoleSchema).optional(),
  // Step 3 fields
  traits: zodStringArray(z.string()).optional(),
  skills: zodStringArray(z.string()).optional(),
  experiences: zodStringArray(ExperienceSchema).optional(),
  certifications: zodStringArray(z.string()).optional(),
  resume: z.string().optional(),
  workAvailability: zodBoolean().optional(),
});

export class CompleteProfileDto extends createZodDto(CompleteProfileSchema) {
  @ApiProperty({ example: 1, minimum: 1, maximum: 4 })
  step: number;

  // Step 1 fields
  @ApiPropertyOptional({
    example: 'Passionate footballer and software engineer',
  })
  about?: string;

  @ApiPropertyOptional({ example: 'USA' })
  country?: string;

  @ApiPropertyOptional({ example: '123 Main St, City, Country' })
  address?: string;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 99 })
  shirtNumber?: number;

  @ApiPropertyOptional({ example: 1995, minimum: 1950, maximum: 2010 })
  birthYear?: number;

  @ApiPropertyOptional({ example: 'Played for local club since 2010' })
  sportsHistory?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  industry?: string;

  @ApiPropertyOptional({ example: 5, minimum: 0, maximum: 50 })
  yearsOfExperience?: number;

  // Step 2 fields
  @ApiPropertyOptional({
    type: [String],
    example: ['USA', 'Canada'],
    maxItems: 5,
  })
  workLocations?: string[];

  @ApiPropertyOptional()
  employmentType?: {
    primary?: EmploymentType;
    secondary?: EmploymentType[];
  };

  @ApiPropertyOptional()
  jobRole?: {
    primary?: string;
    secondary?: string[];
  };

  // Step 3 fields
  @ApiPropertyOptional({ type: [String], example: ['Leadership', 'Teamwork'] })
  traits?: string[];

  @ApiPropertyOptional({ type: [String], example: ['JavaScript', 'Python'] })
  skills?: string[];

  @ApiPropertyOptional({ type: [ExperienceDto] })
  experiences?: ExperienceDto[];

  @ApiPropertyOptional({
    type: [String],
    example: ['AWS Certified', 'Scrum Master'],
  })
  certifications?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/resume.pdf' })
  resume?: string;

  @ApiPropertyOptional({ example: true })
  workAvailability?: boolean;
}
