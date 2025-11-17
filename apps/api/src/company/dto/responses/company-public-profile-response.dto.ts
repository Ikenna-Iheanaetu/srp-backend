import { ApiProperty } from '@nestjs/swagger';

class PublicClubDto {
  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  banner?: string;

  @ApiProperty({ required: false })
  preferredColor?: string;
}

export class CompanyPublicProfileResponseDto {
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
  avatar?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  region?: any;

  @ApiProperty({ required: false })
  tagline?: string;

  @ApiProperty({ required: false })
  industry?: string;

  @ApiProperty({ required: false })
  focus?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  preferredClubs?: any;

  @ApiProperty({ required: false })
  score?: number;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  availability?: string;

  @ApiProperty({ required: false })
  secondaryAvatar?: string;

  @ApiProperty({ required: false })
  club?: PublicClubDto;
}

