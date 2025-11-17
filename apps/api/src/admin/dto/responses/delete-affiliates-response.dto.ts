import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class DeleteAffiliateResponseDto extends BaseResponseDto {
  @ApiProperty({
    example: 'Affiliate and all related data deleted successfully',
  })
  declare message: string;
}
