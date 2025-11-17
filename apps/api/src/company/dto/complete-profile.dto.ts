import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodInteger, zodJsonString } from 'src/common/validators';

const RegionSchema = z.object({
  primary: z.string().optional(),
  secondary: z
    .array(z.string())
    .max(4, { message: 'Secondary regions cannot have more than 4 values' })
    .optional(),
});

export const CompanyCompleteProfileSchema = z.object({
  step: zodInteger(z.number().int().min(1).max(1)),
  about: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  tagline: z.string().optional(),
  industry: z.string().optional(),
  region: zodJsonString(RegionSchema).optional(),
});

export class RegionDto extends createZodDto(RegionSchema) {
  @ApiPropertyOptional({ example: 'North America' })
  primary?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Europe', 'Asia', 'South America'],
    description: 'Maximum 4 secondary regions allowed',
    maxItems: 4,
  })
  secondary?: string[];
}

export class CompanyCompleteProfileDto extends createZodDto(
  CompanyCompleteProfileSchema,
) {
  @ApiProperty({ example: 1, minimum: 1, maximum: 2 })
  step: number;

  // Step 1 fields
  @ApiPropertyOptional({
    example: 'We are a leading sports technology company...',
  })
  about?: string;

  @ApiPropertyOptional({ example: 'United States' })
  country?: string;

  @ApiPropertyOptional({ example: '123 Sports Ave, New York, NY' })
  address?: string;

  @ApiPropertyOptional({ example: 'Connecting athletes with opportunities' })
  tagline?: string;

  @ApiPropertyOptional({ example: 'Sports Technology' })
  industry?: string;
  
  @ApiPropertyOptional({ type: RegionDto })
  region?: RegionDto;
}
