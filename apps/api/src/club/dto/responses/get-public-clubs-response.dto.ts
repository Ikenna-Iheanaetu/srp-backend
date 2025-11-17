import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class PublicClubItemDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

  @ApiProperty({ example: 'Sports Club 3' })
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatar: string;

  @ApiProperty({ example: 'CLUB123' })
  refcode: string;
}

export class PublicClubDataWrapperDto {
  @ApiProperty({ type: [PublicClubItemDto] })
  data: PublicClubItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class GetPublicClubsResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Clubs fetched successfully' })
  declare message: string;

  @ApiProperty({ type: PublicClubDataWrapperDto })
  data: PublicClubDataWrapperDto;
}
