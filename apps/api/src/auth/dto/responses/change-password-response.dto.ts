import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class ChangePasswordResponseDto extends BaseResponseDto {
  @ApiProperty({
    example: 'Password changed successfully',
  })
  declare message: string;
}
