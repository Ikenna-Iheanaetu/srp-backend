import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import type { RegionJson } from 'src/types/json-models/region.type';

export class ClubInfoDto {
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  avatar?: string;

  @ApiPropertyOptional({ example: '#FF0000' })
  preferredColor?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/banner.png' })
  banner?: string;
}

export class CompanyProfileDataDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Tech Sports Inc.' })
  name: string;

  @ApiProperty({ example: 'company@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'HR Manager' })
  role?: string;

  @ApiPropertyOptional({ example: 'Available for partnerships' })
  availability?: string;

  @ApiPropertyOptional({ 
    example: { primary: 'North America', secondary: ['Europe', 'Asia'] } 
  })
  region?: RegionJson;

  @ApiPropertyOptional({ example: '123 Sports Ave, New York, NY' })
  address?: string;

  @ApiPropertyOptional({ example: [1, 2] })
  onboardingSteps?: number[];

  @ApiPropertyOptional({ example: 'We are a leading sports technology company...' })
  about?: string;

  @ApiPropertyOptional({ example: 'company'})
  userType?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  avatar?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/secondary-avatar.png' })
  secondaryAvatar?: string;

  @ApiPropertyOptional({ example: 'Connecting athletes with opportunities' })
  tagline?: string;

  @ApiPropertyOptional({ example: 'Sports Technology' })
  industry?: string;

  @ApiPropertyOptional({ example: 'Player Development' })
  focus?: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiPropertyOptional({ example: ['Club A', 'Club B'] })
  preferredClubs?: string[];

  @ApiPropertyOptional({ example: 'United States' })
  country?: string;

  @ApiProperty({ example: false })
  isApproved: boolean;

  @ApiPropertyOptional({ type: ClubInfoDto })
  club?: ClubInfoDto;

  @ApiProperty({ example: false })
  isQuestionnaireTaken: boolean;

  @ApiPropertyOptional({ example: 85 })
  score?: number;

  @ApiPropertyOptional({ example: 'Excellent leadership qualities' })
  analysisResult?: string;
}

export class CompanyProfileResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Company profile fetched successfully' })
  declare message: string;

  @ApiProperty({ type: CompanyProfileDataDto })
  data: CompanyProfileDataDto;
}

export class CompleteProfileResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Company profile updated successfully' })
  declare message: string;

  @ApiProperty({
    example: {
      onboardingSteps: [2],
      completedStep: 1,
      isOnboardingComplete: false,
      nextStep: 2
    }
  })
  data: {
    onboardingSteps: number[];
    completedStep: number;
    isOnboardingComplete: boolean;
    nextStep: number | null;
  };
}

export class UpdateProfileResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Company profile updated successfully' })
  declare message: string;
}
