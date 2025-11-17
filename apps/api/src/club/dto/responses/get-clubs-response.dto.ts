import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class ClubItemDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

  @ApiProperty({ example: 'Sports Club 3' })
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string;

  @ApiProperty({ example: 'REF123' })
  refCode: string;

  @ApiProperty({ example: 15, description: 'Number of approved affiliates' })
  count: number;
}

export class ClubDataWrapperDto {
  @ApiProperty({ type: [ClubItemDto] })
  data: ClubItemDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class GetClubsResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Clubs fetched successfully' })
  declare message: string;

  @ApiProperty({ type: ClubDataWrapperDto })
  data: ClubDataWrapperDto;
}
