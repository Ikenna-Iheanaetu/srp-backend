import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class VerifyOtpResponseDto extends BaseResponseDto {
  @ApiProperty({
    example: 'OTP verified successfully.',
  })
  declare message: string;

  @ApiProperty({
    description: 'Response data based on OTP type',
    example: {
      resetToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      sessionToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      userId: 'user123',
      affiliateId: 'affiliate456',
      email: 'user@example.com',
    },
  })
  data: {
    resetToken?: string;
    sessionToken?: string;
    userId?: string;
    affiliateId?: string;
    email?: string;
  };
}
