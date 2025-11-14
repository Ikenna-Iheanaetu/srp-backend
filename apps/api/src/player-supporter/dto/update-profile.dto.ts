import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EmploymentType } from '@prisma/client';
import { CompleteProfileSchema, ExperienceDto } from './complete-profile.dto';

const UpdateProfileSchema = CompleteProfileSchema.omit({
  step: true,
}).extend({
  name: z.string().min(1).optional(),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {
  @ApiPropertyOptional({ example: 'John Doe' })
  name?: string;

  @ApiPropertyOptional()
  about?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  shirtNumber?: number;

  @ApiPropertyOptional()
  birthYear?: number;

  @ApiPropertyOptional()
  sportsHistory?: string;

  @ApiPropertyOptional()
  industry?: string;

  @ApiPropertyOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  traits?: string[];

  @ApiPropertyOptional()
  skills?: string[];

  @ApiPropertyOptional({ type: [ExperienceDto] })
  experiences?: ExperienceDto[];

  @ApiPropertyOptional()
  certifications?: string[];

  @ApiPropertyOptional()
  resume?: string;

  @ApiPropertyOptional()
  workAvailability?: boolean;
}
