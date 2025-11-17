import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class DeletePlayerResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Player and all related data deleted successfully' })
  declare message: string;
}
