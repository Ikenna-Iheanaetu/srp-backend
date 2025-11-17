import { ApiProperty } from '@nestjs/swagger';
import { AffiliateStatus, AffiliateType } from '@prisma/client';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class AffiliateClubDto {
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

export class AffiliateItemDto {
  @ApiProperty({
    example: '68c02dec6759f60fe9213820',
    description: 'Profile ID (Player/Company ID based on affiliate type)'
  })
  id: string;

  @ApiProperty({
    example: '68c02dec6759f60fe9213821',
    description: 'Affiliate record ID'
  })
  affiliateId: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({
    example: 'player',
    enum: AffiliateType,
    description: 'Type of affiliate',
  })
  type: string;

  @ApiProperty({
    example: 'active',
    enum: AffiliateStatus,
    description: 'Status of affiliate',
  })
  status: string;

  @ApiProperty({ type: AffiliateClubDto, nullable: true })
  club: AffiliateClubDto | null;
}

export class AffiliateDataWrapperDto {
  @ApiProperty({ type: [AffiliateItemDto] })
  affiliateList: AffiliateItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class GetAffiliatesResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Affiliates fetched successfully' })
  declare message: string;

  @ApiProperty({ type: AffiliateDataWrapperDto })
  data: AffiliateDataWrapperDto;
}
