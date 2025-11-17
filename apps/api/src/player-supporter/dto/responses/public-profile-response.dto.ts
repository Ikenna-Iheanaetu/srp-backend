import { ApiProperty } from '@nestjs/swagger';

class PublicClubDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  banner?: string;

  @ApiProperty({ required: false })
  preferredColor?: string;
}

export class PublicProfileResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  userType?: string;

  @ApiProperty({ required: false })
  about?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  workAvailability?: boolean;

  @ApiProperty({ required: false, type: [String] })
  workLocations?: string[];

  @ApiProperty({ required: false })
  employmentType?: any;

  @ApiProperty({ required: false, type: [String] })
  traits?: string[];

  @ApiProperty({ required: false, type: [String] })
  skills?: string[];

  @ApiProperty({ required: false })
  resume?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false, type: [Object] })
  experiences?: any[];

  @ApiProperty({ required: false })
  shirtNumber?: number;

  @ApiProperty({ required: false })
  birthYear?: number;

  @ApiProperty({ required: false })
  sportsHistory?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  secondaryAvatar?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  yearsOfExperience?: number;

  @ApiProperty({ required: false, type: [String] })
  certifications?: string[];

  @ApiProperty({ required: false })
  score?: number;

  @ApiProperty({ required: false })
  club?: PublicClubDto;

  @ApiProperty({ required: false })
  industry?: string;

  @ApiProperty({ required: false })
  jobRole?: any;
}
