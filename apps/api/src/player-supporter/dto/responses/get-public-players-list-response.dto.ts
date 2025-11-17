import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

class PublicPlayerListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class GetPublicPlayersListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Players list fetched successfully' })
  message: string;

  @ApiProperty({ type: [PublicPlayerListItemDto] })
  data: PublicPlayerListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
