import { ApiProperty } from '@nestjs/swagger';
import { LoginResponseDto } from './login-response.dto';

export class VerifyAccountResponseDto extends LoginResponseDto {
  @ApiProperty({ example: 'Account verified successfully' })
  declare message: string;
}
