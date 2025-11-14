import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class LogoutResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Logout successful' })
  declare message: string;
}
