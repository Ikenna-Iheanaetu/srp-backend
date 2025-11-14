import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class LoginUserDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'player' })
  userType: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string;

  @ApiProperty({ example: [1, 2, 3] })
  onboardingSteps: number[];

  @ApiProperty({ example: 'active' })
  status: string;

  // Add other fields based on user type
  [key: string]: any;
}

export class LoginDataDto {
  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto;

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

export class LoginResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Login successful' })
  declare message: string;

  @ApiProperty({ type: LoginDataDto })
  data: LoginDataDto;
}
