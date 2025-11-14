import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { Prisma } from '@prisma/client';
import { NotificationItemDto } from './dto/responses/notification-response.dto';
import { UpdateNotificationStatusDto } from './dto/update-notification-status.dto';
import { UpdateNotificationStatusBulkDto } from './dto/update-notification-status-bulk.dto';
import { DeleteNotificationsBulkDto } from './dto/delete-notifications-bulk.dto';
import { createPaginationMeta } from 'src/utils';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string, q: GetNotificationsDto) {
    const page = Number(q.page ?? 1);
    const take = Number(q.limit ?? 10);
    const skip = (page - 1) * take;

    this.logger.log(
      `Fetching notifications for user ${userId} page=${page} limit=${take} status=${q.status?.join(', ')}`,
    );

    try {
      const baseWhere: Prisma.NotificationWhereInput = {
        userId,
      };

      if (q.status && q.status.length > 0) {
        baseWhere.status = {
          in: q.status,
        };
      }

      if (q.search) {
        baseWhere.OR = [
          {
            title: {
              contains: q.search,
              mode: 'insensitive',
            },
          },
          {
            message: {
              contains: q.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [total, notifications] = await Promise.all([
        this.prisma.notification.count({ where: baseWhere }),
        this.prisma.notification.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      const notificationList: NotificationItemDto[] = notifications.map(
        (notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type.toLowerCase(),
          status: notification.status.toLowerCase(),
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
        }),
      );

      this.logger.log(
        `Returned ${notificationList.length} notifications out of ${total} total for statuses: ${q.status?.join(', ') || 'all'}`,
      );

      return {
        success: true,
        message: 'Notifications fetched successfully',
        data: {
          data: notificationList,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch notifications for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch notifications. Please try again later.',
      );
    }
  }

  async updateNotificationStatus(
    userId: string,
    id: string,
    dto: UpdateNotificationStatusDto,
  ) {
    const { status } = dto;

    this.logger.log(
      `Updating notification ${id} status to ${status} for user ${userId}`,
    );

    try {
      const updatedNotification = await this.prisma.notification.updateMany({
        where: {
          id,
          userId,
        },
        data: {
          status,
        },
      });

      if (updatedNotification.count === 0) {
        this.logger.warn(`Notification not found: ${id} for user ${userId}`);
        throw new NotFoundException('Notification not found');
      }

      this.logger.log(
        `Notification ${id} status updated successfully to ${status}`,
      );
      return {
        success: true,
        message: 'Notification status updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to update notification ${id} for user ${userId}:`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update notification status. Please try again later.',
      );
    }
  }

  async updateNotificationStatusBulk(
    userId: string,
    dto: UpdateNotificationStatusBulkDto,
  ) {
    const { ids, status } = dto;

    this.logger.log(
      `Updating ${ids.length} notifications to ${status} for user ${userId}`,
    );

    try {
      const updatedNotifications = await this.prisma.notification.updateMany({
        where: {
          id: {
            in: ids,
          },
          userId,
        },
        data: {
          status,
        },
      });

      if (updatedNotifications.count === 0) {
        this.logger.warn(
          `No notifications found for user ${userId} with provided IDs`,
        );
        throw new NotFoundException(
          'No notifications found with the provided IDs',
        );
      }

      const updatedCount = updatedNotifications.count;
      const notFoundCount = ids.length - updatedCount;

      this.logger.log(
        `${updatedCount} notifications updated successfully to ${status}. ${notFoundCount > 0 ? `${notFoundCount} notifications not found.` : ''}`,
      );

      return {
        success: true,
        message: `${updatedCount} notification${updatedCount > 1 ? 's' : ''} updated successfully`,
        data: {
          updatedCount,
          totalRequested: ids.length,
          notFoundCount,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to update notifications for user ${userId}:`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update notification status. Please try again later.',
      );
    }
  }

  async deleteNotification(userId: string, id: string) {
    this.logger.log(`Deleting notification ${id} for user ${userId}`);

    try {
      await this.prisma.notification.delete({
        where: {
          id,
          userId,
        },
      });

      this.logger.log(
        `Notification ${id} deleted successfully for user ${userId}`,
      );

      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete notification ${id} for user ${userId}:`,
        error,
      );

      if (error.code === 'P2025') {
        this.logger.warn(`Notification not found: ${id} for user ${userId}`);
        throw new NotFoundException('Notification not found');
      }

      throw new InternalServerErrorException(
        'Failed to delete notification. Please try again later.',
      );
    }
  }

  async deleteNotificationsBulk(
    userId: string,
    dto: DeleteNotificationsBulkDto,
  ) {
    const { ids } = dto;

    this.logger.log(`Deleting ${ids.length} notifications for user ${userId}`);

    try {
      const deletedNotifications = await this.prisma.notification.deleteMany({
        where: {
          id: {
            in: ids,
          },
          userId,
        },
      });

      if (deletedNotifications.count === 0) {
        this.logger.warn(
          `No notifications found for user ${userId} with provided IDs`,
        );
        throw new NotFoundException(
          'No notifications found with the provided IDs',
        );
      }

      const deletedCount = deletedNotifications.count;
      const notFoundCount = ids.length - deletedCount;

      this.logger.log(
        `${deletedCount} notifications deleted successfully. ${notFoundCount > 0 ? `${notFoundCount} notifications not found.` : ''}`,
      );

      return {
        success: true,
        message: `${deletedCount} notification${deletedCount > 1 ? 's' : ''} deleted successfully`,
        data: {
          deletedCount,
          totalRequested: ids.length,
          notFoundCount,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete notifications for user ${userId}:`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete notifications. Please try again later.',
      );
    }
  }
}
