import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class ProfileResponseDto {
  @ApiProperty({ example: '60f7b3f7c9e77c001f8e6f9a' })
  id: string;

  @ApiProperty({ example: 'Super Admin' })
  name: string | null; // ← allow null

  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiProperty({ example: 'admin' })
  userType: string;

  @ApiProperty({ example: 'Chief administrator', required: false })
  about?: string | null; // ← allow null & optional

  @ApiProperty({
    example: 'https://cdn.example.com/avatar.png',
    required: false,
  })
  avatar?: string | null; // ← allow null & optional

  @ApiProperty({ example: 'active' })
  status: string;
}

export class AdminProfileResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Profile fetched successfully' })
  declare message: string;

  @ApiProperty({ type: ProfileResponseDto })
  data: ProfileResponseDto;
}
