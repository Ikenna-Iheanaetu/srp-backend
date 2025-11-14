import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class HiredPlayerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  affiliateType: string;

  @ApiPropertyOptional()
  club?: {
    id: string;
    name: string;
    avatar?: string;
  };

  @ApiPropertyOptional()
  status?: string;
}

class GetHiredPlayerWrapperDto {
  @ApiProperty({ type: [HiredPlayerDto] })
  hiredPlayers: HiredPlayerDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class GetHiredPlayersResponseDto extends BaseResponseDto {
  @ApiProperty({ example: "Fetched hired players successfully" })
  declare message: string;

  @ApiProperty({ type: [GetHiredPlayerWrapperDto] })
  data: {
    hiredPlayers: HiredPlayerDto[];
    meta: PaginationMetaDto;
  };
}
