import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

class PublicPlayerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  about?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  workLocations?: string[];

  @ApiProperty({ required: false })
  traits?: string[];

  @ApiProperty({ required: false })
  skills?: string[];

  @ApiProperty({ required: false })
  avatar?: string;
}

export class GetPublicPlayersResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Players fetched successfully' })
  message: string;

  @ApiProperty({ type: [PublicPlayerDto] })
  data: PublicPlayerDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
