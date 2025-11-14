import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class PlayerClubDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiPropertyOptional({ example: 'Manchester United FC' })
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ example: '#FF0000' })
  preferredColor?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  banner?: string;

  @ApiPropertyOptional({ example: 'professional' })
  category?: string;
}

export class PlayerExperienceDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Software Developer' })
  title: string;

  @ApiProperty({ example: 'Tech Corp' })
  company: string;

  @ApiProperty({ example: false })
  current: boolean;

  @ApiProperty({ example: true })
  remote: boolean;

  @ApiPropertyOptional({ example: '2023-01-01T00:00:00.000Z' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  endDate?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  companyPhone?: string;

  @ApiPropertyOptional({ example: 'hr@techcorp.com' })
  companyEmail?: string;

  @ApiPropertyOptional({ example: ['JavaScript', 'TypeScript'] })
  skills?: string[];

  @ApiPropertyOptional({ example: ['React', 'Node.js'] })
  tools?: string[];

  @ApiPropertyOptional({ example: ['Develop web applications', 'Code reviews'] })
  responsibilities?: string[];
}

export class PlayerDataDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Experienced software developer with 5+ years in web development' })
  about?: string;

  @ApiPropertyOptional({ example: ['Leadership', 'Team Player', 'Creative'] })
  traits?: any;

  @ApiPropertyOptional({ example: ['JavaScript', 'TypeScript', 'React'] })
  skills?: any;

  @ApiPropertyOptional({ example: '123 Main St, New York, NY' })
  address?: string;

  @ApiPropertyOptional({ example: ['United States', 'Canada'] })
  workCountry?: any;

  @ApiPropertyOptional({ 
    example: { primary: 'full-time', secondary: ['part-time'] },
    description: 'Employment type preferences'
  })
  employmentType?: any;

  @ApiPropertyOptional({ example: ['AWS Certified', 'Scrum Master'] })
  certifications?: any;

  @ApiPropertyOptional({ example: 'Sports Technology' })
  industry?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  clubId?: string;

  @ApiPropertyOptional({ example: 'professional' })
  clubCategory?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ 
    example: { primary: 'Software Engineer', secondary: ['Full Stack Developer'] },
    description: 'Job role preferences'
  })
  jobRole?: any;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string;

  @ApiProperty({ type: [PlayerExperienceDto] })
  experiences: PlayerExperienceDto[];

  @ApiPropertyOptional({ example: 5 })
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 1990 })
  birthYear?: number;

  @ApiPropertyOptional({ example: 'Played college football for 4 years' })
  sportsHistory?: string;

  @ApiProperty({ example: true })
  availability: boolean;

  @ApiPropertyOptional({ example: [1, 2] })
  onboardingSteps?: any;

  @ApiProperty({ example: false })
  isQuestionnaireTaken: boolean;

  @ApiPropertyOptional({ example: 85 })
  score?: number;

  @ApiPropertyOptional({ example: 'Strong analytical skills with leadership potential' })
  analysisResult?: string;

  @ApiPropertyOptional({ example: 'https://example.com/resume.pdf' })
  resume?: string;

  @ApiPropertyOptional({ example: 10 })
  shirtNumber?: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ example: 'PLAYER' })
  userType: string;

  @ApiProperty({ 
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of job IDs that this player has been shortlisted for by the company'
  })
  shortlistedJobs: string[];

  @ApiPropertyOptional({ type: PlayerClubDto })
  club?: PlayerClubDto;

  @ApiProperty({ example: true })
  isApproved: boolean;

  @ApiPropertyOptional({ example: 'PLAYER' })
  affiliateType?: string;

  @ApiProperty({ 
    example: 'player',
    enum: ['player', 'supporter'],
    description: 'Type of candidate - player or supporter'
  })
  candidateType: 'player' | 'supporter';
}

export class PlayersDataDto {
  @ApiProperty({ type: [PlayerDataDto], description: 'Array of players/supporters' })
  data: PlayerDataDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}

export class PlayersResponseDto extends BaseResponseDto {
  @ApiProperty({ type: PlayersDataDto, description: 'Players data with pagination' })
  data: PlayersDataDto;
}
