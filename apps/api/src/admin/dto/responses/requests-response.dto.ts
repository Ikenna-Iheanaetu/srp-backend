import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class RequestItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '648f1f77bcf86cd799439011' })
  chatId: string;

  @ApiProperty({ example: '2023-12-08' })
  dateTime: string;

  @ApiProperty({ example: 'MSG_1039' })
  requestId: string;

  @ApiProperty({ example: 'player', enum: ['player', 'company'] })
  initiator: 'player' | 'company';

  @ApiProperty({ example: 'John Doe' })
  initiatorName: string;

  @ApiProperty({ example: 'company', enum: ['player', 'company'] })
  recipient: 'player' | 'company';

  @ApiProperty({ example: 'Tech Corp' })
  recipientName: string;

  @ApiProperty({ example: 'Pending', enum: ['Pending', 'Hired', 'Closed', 'Cancelled'] })
  status: string;
}

export class GetRequestsResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Requests fetched successfully' })
  declare message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: getSchemaPath(RequestItemDto) },
      },
      meta: {
        type: 'object',
        properties: {
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 10 },
          total: { type: 'number', example: 50 },
          totalPages: { type: 'number', example: 5 },
        },
      },
    },
  })
  data: {
    data: RequestItemDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
