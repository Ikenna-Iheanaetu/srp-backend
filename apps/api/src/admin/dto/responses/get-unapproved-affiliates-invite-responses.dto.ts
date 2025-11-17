import { ApiProperty } from '@nestjs/swagger';
import { AffiliateType } from '@prisma/client';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class UnapprovedUserClubDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

  @ApiProperty({ example: 'Sports Club 3' })
  name: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatar: string | null;
}

export class UnapprovedUserDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

  @ApiProperty({
    example: 'player',
    enum: AffiliateType,
    description: 'Type of user (company, player, supporter)',
  })
  type: 'company' | 'player' | 'supporter';

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the user or derived from email',
  })
  name: string;

  @ApiProperty({ type: UnapprovedUserClubDto })
  club: UnapprovedUserClubDto;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'When the user was invited',
  })
  invitedAt: string;

  @ApiProperty({ example: true, description: 'Whether the user has signed up' })
  hasSignedUp: boolean;

  @ApiProperty({
    example: '68c02dec6759f60fe9213820',
    description: 'Profile ID from company or player based on user type',
    nullable: true,
  })
  profileId: string | null;
}

export class UnapprovedUserDataWrapperDto {
  @ApiProperty({ type: [UnapprovedUserDto] })
  data: UnapprovedUserDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class GetUnapprovedAffiliatesResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Unapproved affiliates fetched successfully' })
  declare message: string;

  @ApiProperty({ type: UnapprovedUserDataWrapperDto })
  data: UnapprovedUserDataWrapperDto;
}
