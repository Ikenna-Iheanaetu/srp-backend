import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class UpdateAdminProfileResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Admin profile updated successfully' })
  declare message: string;
}
