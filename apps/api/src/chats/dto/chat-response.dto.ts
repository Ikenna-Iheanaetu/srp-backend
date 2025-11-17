import { ApiProperty } from '@nestjs/swagger';
import { MessageAttachmentDto } from './message-attachment.dto';

export class ParticipantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  userType: string;

  @ApiProperty({ required: false })
  avatar?: string;
}

export class CreateChatResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ enum: ['ME', 'THEM'], description: 'Who initiated this chat (always ME for creator)' })
  initiatedBy: 'ME' | 'THEM';

  @ApiProperty({ nullable: true, description: 'Expiration date (null for PENDING chats)' })
  expiresAt: Date | null;

  @ApiProperty({ enum: ['ME', 'THEM', 'EXPIRATION'], required: false, description: 'Who closed this chat (undefined for active chats)' })
  closedBy?: 'ME' | 'THEM' | 'EXPIRATION';

  @ApiProperty()
  recipient: ParticipantDto;

  @ApiProperty()
  createdAt: Date;
}

export class ChatDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ enum: ['ME', 'THEM'] })
  initiatedBy: 'ME' | 'THEM';

  @ApiProperty({ enum: ['ME', 'THEM', 'EXPIRATION'], required: false })
  closedBy?: 'ME' | 'THEM' | 'EXPIRATION';

  @ApiProperty()
  company: ParticipantDto;

  @ApiProperty()
  player: ParticipantDto;

  @ApiProperty({ required: false })
  acceptedAt?: Date;

  @ApiProperty({ nullable: true, required: false, description: 'Expiration date (null for PENDING chats)' })
  expiresAt?: Date | null;

  @ApiProperty({ required: false })
  extensionCount?: number;

  @ApiProperty({ required: false })
  lastMessageAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ChatParticipantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar?: string;
}

export class ChatListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ enum: ['ME', 'THEM'] })
  initiatedBy: 'ME' | 'THEM';

  @ApiProperty({ enum: ['ME', 'THEM', 'EXPIRATION'], required: false })
  closedBy?: 'ME' | 'THEM' | 'EXPIRATION';

  @ApiProperty()
  participant: ChatParticipantDto;

  @ApiProperty({ required: false })
  lastMessage?: string;

  @ApiProperty({ required: false })
  lastMessageAt?: Date;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty({ nullable: true, required: false, description: 'Expiration date (null for PENDING chats)' })
  expiresAt?: Date | null;
}

export class MessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  chatId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ required: false })
  deliveredAt?: Date;

  @ApiProperty({ required: false })
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class AcceptChatResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  acceptedAt: Date;

  @ApiProperty()
  expiresAt: Date;
}

export class DeclineChatResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;
}

export class EndChatResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;
}

export class ExtendChatResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  extensionCount: number;

  @ApiProperty({ description: 'Number of days added in this extension' })
  daysAdded: number;

  @ApiProperty({ description: 'Number of extensions remaining (out of 3 total)' })
  remainingExtensions: number;
}
