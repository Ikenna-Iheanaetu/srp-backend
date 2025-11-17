import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class UpdateNotificationStatusBulkResponseDto extends BaseResponseDto {
  @ApiProperty({ example: '3 notifications updated successfully' })
  declare message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      updatedCount: { type: 'number', example: 3 },
      totalRequested: { type: 'number', example: 5 },
      notFoundCount: { type: 'number', example: 2 },
    },
  })
  data: {
    updatedCount: number;
    totalRequested: number;
    notFoundCount: number;
  };
}
