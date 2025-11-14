import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

class ExperienceDto {
  @ApiProperty({ example: '60f7b3f7c9e77c001f8e6f9a' })
  id: string;

  @ApiProperty({ example: 'Software Engineer' })
  title: string;

  @ApiProperty({ example: 'TechCorp Inc.' })
  company: string;

  @ApiProperty({ example: true })
  current: boolean;

  @ApiProperty({ example: false })
  remote: boolean;

  @ApiProperty({ example: '2023-01-15T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z', required: false })
  endDate?: Date;

  @ApiProperty({ example: ['JavaScript', 'TypeScript'] })
  skills: string[];

  @ApiProperty({ example: ['VS Code', 'Docker'] })
  tools: string[];

  @ApiProperty({ example: ['Code reviews', 'Feature development'] })
  responsibilities: string[];
}

class ClubDto {
  @ApiProperty({ example: '60f7b3f7c9e77c001f8e6f9a', required: false })
  id?: string;

  @ApiProperty({ example: 'Manchester United FC', required: false })
  name?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string;

  @ApiProperty({ example: 'https://example.com/banner.jpg', required: false })
  banner?: string;

  @ApiProperty({ example: '#FF0000', required: false })
  preferredColor?: string;
}

export class PlayerSupporterProfileDto {
  @ApiProperty({ example: '60f7b3f7c9e77c001f8e6f9a' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'player' })
  userType: string;

  @ApiProperty({
    example: 'Passionate footballer and software engineer',
    required: false,
  })
  about?: string;

  @ApiProperty({ example: '123 Main St, City, Country', required: false })
  address?: string;

  @ApiProperty({ example: ['USA', 'Canada'], required: false })
  workLocations?: string[];

  @ApiProperty({ example: ['Leadership', 'Teamwork'], required: false })
  traits?: string[];

  @ApiProperty({ example: ['JavaScript', 'Python'], required: false })
  skills?: string[];

  @ApiProperty({ example: 'https://example.com/resume.pdf', required: false })
  resume?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  phone?: string;

  @ApiProperty({ example: true })
  workAvailability: boolean;

  @ApiProperty({ type: [ExperienceDto] })
  experiences: ExperienceDto[];

  @ApiProperty({ example: 10, required: false })
  shirtNumber?: number;

  @ApiProperty({ example: 1995, required: false })
  birthYear?: number;

  @ApiProperty({ example: 'Played for local club since 2010', required: false })
  sportsHistory?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: [1, 2, 3], required: false })
  onboardingSteps?: number[];

  @ApiProperty({ example: 5, required: false })
  yearsOfExperience?: number;

  @ApiProperty({ example: ['AWS Certified', 'Scrum Master'], required: false })
  certifications?: string[];

  @ApiProperty({ example: 85, required: false })
  score?: number;

  @ApiProperty({ example: true })
  isQuestionnaireTaken: boolean;

  @ApiProperty({ type: ClubDto })
  club: ClubDto;

  @ApiProperty({ example: 'Technology', required: false })
  industry?: string;

  @ApiProperty({ example: false })
  isApproved: boolean;

  @ApiProperty({
    example: { primary: 'full_time', secondary: ['part_time'] },
    required: false,
  })
  employmentType?: object;

  @ApiProperty({
    example: {
      primary: 'Software Engineer',
      secondary: ['Frontend Developer'],
    },
    required: false,
  })
  jobRole?: object;

  @ApiProperty({ example: 'Analytical and strategic thinker', required: false })
  analysisResult?: string;
}

export class PlayerSupporterProfileResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Profile fetched successfully' })
  declare message: string;

  @ApiProperty({
    type: PlayerSupporterProfileDto,
  })
  data: PlayerSupporterProfileDto;
}
