import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class UserDataDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string;

  @ApiProperty({ example: [1, 2, 3] })
  onboardingSteps: number[];

  @ApiProperty({ example: 'player' })
  type: string;
}

export class AuthDataDto {
  @ApiProperty({ type: UserDataDto })
  user: UserDataDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class SignupResponseDto extends BaseResponseDto {
  @ApiProperty({
    example:
      'User registered successfully. Verification email will be sent shortly.',
  })
  declare message: string;

  @ApiProperty({ type: AuthDataDto })
  data: AuthDataDto;
}
