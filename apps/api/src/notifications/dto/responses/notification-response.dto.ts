import { ApiProperty } from '@nestjs/swagger';
import { NotificationStatus, NotificationType } from '@prisma/client';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class NotificationItemDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

  @ApiProperty({ example: 'New Job Application' })
  title: string;

  @ApiProperty({
    example:
      'You have received a new job application for Software Engineer position',
  })
  message: string;

  @ApiProperty({
    example: 'job_alert',
    enum: NotificationType,
    description: 'Type of notification',
  })
  type: string;

  @ApiProperty({
    example: 'unread',
    enum: NotificationStatus,
    description: 'Status of notification',
  })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

export class NotificationDataWrapperDto {
  @ApiProperty({ type: [NotificationItemDto] })
  notifications: NotificationItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class GetNotificationsResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Notifications fetched successfully' })
  declare message: string;

  @ApiProperty({ type: NotificationDataWrapperDto })
  data: NotificationDataWrapperDto;
}
