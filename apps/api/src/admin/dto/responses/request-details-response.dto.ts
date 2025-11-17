import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class RequestEventDto {
  @ApiProperty({ example: 'CONVERSATION_ENDED' })
  eventType: string;

  @ApiProperty({ example: 'Conversation ended' })
  description: string;

  @ApiProperty({ example: '2023-12-08T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: { gracePeriodDays: 14 }, required: false })
  metadata?: Record<string, any>;
}

export class RequestDetailsDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '64af1f77bcf86cd799439011' })
  chatId: string;

  @ApiProperty({ example: 'MSG_1039' })
  requestCode: string;

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

  @ApiProperty({ type: [RequestEventDto] })
  events: RequestEventDto[];
}

export class GetRequestDetailsResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Request details fetched successfully' })
  declare message: string;

  @ApiProperty({ type: RequestDetailsDto })
  data: RequestDetailsDto;
}
