import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class ForgotPasswordResponseDto extends BaseResponseDto {
  @ApiProperty({
    example: 'Your account password reset otp has been sent to your email',
  })
  declare message: string;
}