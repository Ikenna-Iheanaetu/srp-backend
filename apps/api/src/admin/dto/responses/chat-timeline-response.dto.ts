import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

export class ChatTimelineEventDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'CONVERSATION_ENDED' })
  eventType: string;

  @ApiProperty({ example: 'Conversation ended' })
  description: string;

  @ApiProperty({ example: '2023-12-08T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: { reason: 'User ended chat' }, required: false })
  metadata?: Record<string, any>;
}

export class GetChatTimelineResponseDto extends BaseResponseDto {
  @ApiProperty({ type: ChatTimelineEventDto, isArray: true })
  data: ChatTimelineEventDto[];
}

