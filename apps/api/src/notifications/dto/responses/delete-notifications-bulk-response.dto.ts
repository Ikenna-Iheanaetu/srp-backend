import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class DeleteNotificationsBulkResponseDto extends BaseResponseDto {
  @ApiProperty({ example: '3 notifications deleted successfully' })
  declare message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      deletedCount: { type: 'number', example: 3 },
      totalRequested: { type: 'number', example: 5 },
      notFoundCount: { type: 'number', example: 2 },
    },
  })
  data: {
    deletedCount: number;
    totalRequested: number;
    notFoundCount: number;
  };
}
