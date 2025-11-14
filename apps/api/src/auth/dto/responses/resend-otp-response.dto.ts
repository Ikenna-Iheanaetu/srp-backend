import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class ResendOtpResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'OTP resent successfully' })
  declare message: string;
}
