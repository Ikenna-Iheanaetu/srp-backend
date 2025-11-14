import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class UpdateInviteResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Invite approved successfully' })
  declare message: string;
}
