import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class ResetPasswordResponseDto extends BaseResponseDto {
  @ApiProperty({
    example: 'Your account password has been changed successfully',
  })
  declare message: string;
}
