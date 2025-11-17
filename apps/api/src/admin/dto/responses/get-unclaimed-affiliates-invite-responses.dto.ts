import { ApiProperty } from "@nestjs/swagger";
import { AffiliateStatus, AffiliateType } from "@prisma/client";
import { BaseResponseDto } from "src/common/dto/base-response.dto";
import { PaginationMetaDto } from "src/common/dto/pagination-meta.dto";

export class UnclaimedAffiliateClubDto {
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

export class UnclaimedAffiliateItemDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

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

  @ApiProperty({ type: UnclaimedAffiliateClubDto, nullable: true })
  club: UnclaimedAffiliateClubDto | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

export class UnclaimedAffiliateDataWrapperDto {
  @ApiProperty({ type: [UnclaimedAffiliateItemDto] })
  affiliateList: UnclaimedAffiliateItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class GetUnclaimedAffiliatesResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Unclaimed affiliates fetched successfully' })
  declare message: string;

  @ApiProperty({ type: UnclaimedAffiliateDataWrapperDto })
  data: UnclaimedAffiliateDataWrapperDto;
}
