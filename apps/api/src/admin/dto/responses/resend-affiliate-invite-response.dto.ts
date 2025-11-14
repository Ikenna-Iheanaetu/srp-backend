import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class ResendAffiliateInviteResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Invite has been resent successfully' })
  declare message: string;
}
