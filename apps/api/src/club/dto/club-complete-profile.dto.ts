import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodInteger, zodJsonString } from 'src/common/validators';

const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'number' ? String(val) : val))
    .optional(),
});

const SocialsSchema = z.object({
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
});

export const ClubCompleteProfileSchema = z.object({
  step: zodInteger(z.number().int().min(1).max(2)),
  category: z.string().optional(),
  about: z.string().optional(),
  address: zodJsonString(AddressSchema).optional(),
  preferredColor: z.string().optional(),
  phone: z.string().optional(),
  region: z.string().optional(),
  focus: z.string().optional(),
  socials: zodJsonString(SocialsSchema).optional(),
  website: z.string().optional(),
});

export class AddressDto extends createZodDto(AddressSchema) {
  @ApiPropertyOptional({ example: '123 Main St' })
  street?: string;

  @ApiPropertyOptional({ example: 'New York' })
  city?: string;

  @ApiPropertyOptional({ example: '10001' })
  postalCode?: string;
}

export class SocialsDto extends createZodDto(SocialsSchema) {
  @ApiPropertyOptional({ example: 'https://facebook.com/club' })
  facebook?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/club' })
  twitter?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/club' })
  instagram?: string;
}

export class CompleteProfileDto extends createZodDto(
  ClubCompleteProfileSchema,
) {
  @ApiProperty({
    example: 1,
    description: 'Onboarding step (1, 2, or 3)',
    minimum: 1,
    maximum: 3,
  })
  step: number;

  // Step 1 fields
  @ApiPropertyOptional({ example: 'Premier League' })
  category?: string;

  @ApiPropertyOptional({ example: 'We are a leading sports club...' })
  about?: string;

  @ApiPropertyOptional({
    type: AddressDto,
    description: 'Club address',
  })
  address?: AddressDto;

  @ApiPropertyOptional({ example: '#FF5733' })
  preferredColor?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Europe' })
  region?: string;

  // Step 2 fields
  @ApiPropertyOptional({ example: 'Youth Development' })
  focus?: string;

  @ApiPropertyOptional({
    type: SocialsDto,
    description: 'Social media links',
  })
  socials?: SocialsDto;

  @ApiPropertyOptional({ example: 'https://club.com' })
  website?: string;
}
