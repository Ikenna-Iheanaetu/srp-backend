import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { GetNotificationsResponseDto } from './dto/responses/notification-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { UpdateNotificationStatusDto } from './dto/update-notification-status.dto';
import { UpdateNotificationStatusResponseDto } from './dto/responses/update-notifications-respoonse.dto';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { DeleteNotificationResponseDto } from './dto/responses/delete-notification.-response.dto';
import { UpdateNotificationStatusBulkDto } from './dto/update-notification-status-bulk.dto';
import { UpdateNotificationStatusBulkResponseDto } from './dto/responses/update-notification-status-bulk-response.dto';
import { DeleteNotificationsBulkDto } from './dto/delete-notifications-bulk.dto';
import { DeleteNotificationsBulkResponseDto } from './dto/responses/delete-notifications-bulk-response.dto';
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get notifications' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Notifications fetched successfully',
    GetNotificationsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch notifications. Please try again later.',
    ErrorResponseDto,
  )
  async getNotifications(
    @CurrentUser('userId') userId: string,
    @Query() dto: GetNotificationsDto,
  ) {
    return this.notificationsService.getNotifications(userId, dto);
  }

  @Patch('/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update multiple notifications status' })
  @ApiBody({
    description: 'Update multiple notifications status',
    type: UpdateNotificationStatusBulkDto,
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Notifications status updated successfully',
    UpdateNotificationStatusBulkResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'No notifications found with the provided IDs',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to update notification status. Please try again later.',
    ErrorResponseDto,
  )
  async updateNotificationStatusBulk(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateNotificationStatusBulkDto,
  ) {
    return this.notificationsService.updateNotificationStatusBulk(userId, dto);
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification status' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    description: 'Update notification status',
    type: UpdateNotificationStatusDto,
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Notification status updated successfully',
    UpdateNotificationStatusResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Notification not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to update notification status. Please try again later.',
    ErrorResponseDto,
  )
  async updateNotificationStatus(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationStatusDto,
  ) {
    return this.notificationsService.updateNotificationStatus(userId, id, dto);
  }

  @Delete('/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiBody({
    description: 'Delete multiple notifications',
    type: DeleteNotificationsBulkDto,
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Notifications deleted successfully',
    DeleteNotificationsBulkResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'No notifications found with the provided IDs',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to delete notifications. Please try again later.',
    ErrorResponseDto,
  )
  async deleteNotificationsBulk(
    @CurrentUser('userId') userId: string,
    @Body() dto: DeleteNotificationsBulkDto,
  ) {
    return this.notificationsService.deleteNotificationsBulk(userId, dto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Notification deleted successfully',
    DeleteNotificationResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Notification not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to delete notification. Please try again later.',
    ErrorResponseDto,
  )
  async deleteNotification(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.deleteNotification(userId, id);
  }
}
