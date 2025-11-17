import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationStatus, NotificationType } from '@prisma/client';

const prismaMock = {
  notification: {
    count: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('getNotifications', () => {
    const userId = 'user-1';
    const baseNotifs = [
      {
        id: 'n1',
        title: 'Welcome',
        message: 'Hello',
        type: NotificationType.SYSTEM,
        status: NotificationStatus.UNREAD,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      },
      {
        id: 'n2',
        title: 'Update',
        message: 'Something changed',
        type: NotificationType.SYSTEM,
        status: NotificationStatus.READ,
        createdAt: new Date('2025-01-02T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      },
    ];

    it('returns notifications with default pagination', async () => {
      prismaMock.notification.count.mockResolvedValue(2);
      prismaMock.notification.findMany.mockResolvedValue(baseNotifs);

      const res = await service.getNotifications(userId, {} as any);

      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(res.success).toBe(true);
      expect(res.data.data).toHaveLength(2);
      expect(res.data.data[0]).toMatchObject({
        id: 'n1',
        title: 'Welcome',
        message: 'Hello',
        type: 'system',
        status: 'unread',
      });
      expect(res.data.meta).toMatchObject({
        total: 2,
        totalPages: 1,
        page: 1,
        limit: 10,
      });
    });

   it('applies multiple status filters', async () => {
     prismaMock.notification.count.mockResolvedValue(0);
     prismaMock.notification.findMany.mockResolvedValue([]);

     await service.getNotifications(userId, {
       status: [NotificationStatus.UNREAD, NotificationStatus.READ],
     } as any);

     expect(prismaMock.notification.count).toHaveBeenCalledWith({
       where: {
         userId,
         status: {
           in: [NotificationStatus.UNREAD, NotificationStatus.READ],
         },
       },
     });
   });

   it('handles empty status array', async () => {
     prismaMock.notification.count.mockResolvedValue(0);
     prismaMock.notification.findMany.mockResolvedValue([]);

     await service.getNotifications(userId, {
       status: [],
     } as any);

     expect(prismaMock.notification.count).toHaveBeenCalledWith({
       where: {
         userId,
         // status filter should not be applied when array is empty
       },
     });
   });

    it('applies search filter on title and message', async () => {
      prismaMock.notification.count.mockResolvedValue(0);
      prismaMock.notification.findMany.mockResolvedValue([]);

      await service.getNotifications(userId, { search: 'hello' } as any);

      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: {
          userId,
          OR: [
            { title: { contains: 'hello', mode: 'insensitive' } },
            { message: { contains: 'hello', mode: 'insensitive' } },
          ],
        },
      });
    });

    it('handles pagination overrides', async () => {
      prismaMock.notification.count.mockResolvedValue(0);
      prismaMock.notification.findMany.mockResolvedValue([]);

      await service.getNotifications(userId, { page: 3, limit: 5 } as any);

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('combines status and search filters', async () => {
      prismaMock.notification.count.mockResolvedValue(1);
      prismaMock.notification.findMany.mockResolvedValue([baseNotifs[0]]);

      await service.getNotifications(userId, {
        status: [NotificationStatus.UNREAD],
        search: 'welcome',
      } as any);

      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: {
          userId,
          status: {
            in: [NotificationStatus.UNREAD],
          },
          OR: [
            { title: { contains: 'welcome', mode: 'insensitive' } },
            { message: { contains: 'welcome', mode: 'insensitive' } },
          ],
        },
      });
    });

    it('wraps unknown errors', async () => {
      prismaMock.notification.count.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getNotifications(userId, {} as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('updateNotificationStatus', () => {
    const userId = 'user-1';
    const notificationId = 'n1';

    beforeEach(() => {
      prismaMock.notification.updateMany.mockReset();
    });

    it('updates status successfully', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.updateNotificationStatus(
        userId,
        notificationId,
        {
          status: NotificationStatus.READ,
        } as any,
      );

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: { id: notificationId, userId },
        data: { status: NotificationStatus.READ },
      });
      expect(res).toEqual({
        success: true,
        message: 'Notification status updated successfully',
      });
    });

    it('throws NotFoundException when no records are updated', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateNotificationStatus(userId, notificationId, {
          status: NotificationStatus.UNREAD,
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('wraps unknown errors as InternalServerErrorException', async () => {
      prismaMock.notification.updateMany.mockRejectedValue(
        new Error('DB fail'),
      );

      await expect(
        service.updateNotificationStatus(userId, notificationId, {
          status: NotificationStatus.UNREAD,
        } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('deleteNotification', () => {
    const userId = 'user-1';
    const notificationId = 'n1';

    beforeEach(() => {
      prismaMock.notification.delete.mockReset();
    });

    it('deletes notification successfully', async () => {
      const mockDeletedNotification = {
        id: notificationId,
        userId,
        title: 'Test',
        message: 'Test message',
        type: NotificationType.SYSTEM,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.notification.delete.mockResolvedValue(mockDeletedNotification);

      const res = await service.deleteNotification(userId, notificationId);

      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: {
          id: notificationId,
          userId,
        },
      });
      expect(res).toEqual({
        success: true,
        message: 'Notification deleted successfully',
      });
    });

    it('throws NotFoundException when notification does not exist', async () => {
      const prismaError = new Error('Record to delete does not exist.');
      (prismaError as any).code = 'P2025';

      prismaMock.notification.delete.mockRejectedValue(prismaError);

      await expect(
        service.deleteNotification(userId, notificationId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: {
          id: notificationId,
          userId,
        },
      });
    });

    it('wraps unknown errors as InternalServerErrorException', async () => {
      prismaMock.notification.delete.mockRejectedValue(new Error('DB fail'));

      await expect(
        service.deleteNotification(userId, notificationId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('updateNotificationStatusBulk', () => {
    const userId = 'user-1';
    const notificationIds = ['n1', 'n2', 'n3'];

    beforeEach(() => {
      prismaMock.notification.updateMany.mockReset();
    });

    it('updates all notifications successfully', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

      const res = await service.updateNotificationStatusBulk(userId, {
        ids: notificationIds,
        status: NotificationStatus.READ,
      } as any);

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: {
          status: NotificationStatus.READ,
        },
      });
      expect(res).toEqual({
        success: true,
        message: '3 notifications updated successfully',
        data: {
          updatedCount: 3,
          totalRequested: 3,
          notFoundCount: 0,
        },
      });
    });

    it('updates some notifications successfully (partial match)', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 2 });

      const res = await service.updateNotificationStatusBulk(userId, {
        ids: notificationIds,
        status: NotificationStatus.READ,
      } as any);

      expect(res).toEqual({
        success: true,
        message: '2 notifications updated successfully',
        data: {
          updatedCount: 2,
          totalRequested: 3,
          notFoundCount: 1,
        },
      });
    });

    it('throws NotFoundException when no notifications are found', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateNotificationStatusBulk(userId, {
          ids: notificationIds,
          status: NotificationStatus.READ,
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: {
          status: NotificationStatus.READ,
        },
      });
    });

    it('handles single notification update with correct grammar', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.updateNotificationStatusBulk(userId, {
        ids: ['n1'],
        status: NotificationStatus.READ,
      } as any);

      expect(res.message).toBe('1 notification updated successfully');
    });

    it('wraps unknown errors as InternalServerErrorException', async () => {
      prismaMock.notification.updateMany.mockRejectedValue(
        new Error('DB fail'),
      );

      await expect(
        service.updateNotificationStatusBulk(userId, {
          ids: notificationIds,
          status: NotificationStatus.READ,
        } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('preserves NotFoundException when thrown', async () => {
      const notFoundError = new NotFoundException('Custom not found');
      prismaMock.notification.updateMany.mockRejectedValue(notFoundError);

      await expect(
        service.updateNotificationStatusBulk(userId, {
          ids: notificationIds,
          status: NotificationStatus.READ,
        } as any),
      ).rejects.toBe(notFoundError);
    });

    it('handles empty IDs array', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateNotificationStatusBulk(userId, {
          ids: [],
          status: NotificationStatus.READ,
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteNotificationsBulk', () => {
    const userId = 'user-1';
    const notificationIds = ['n1', 'n2', 'n3'];

    beforeEach(() => {
      prismaMock.notification.deleteMany.mockReset();
    });

    it('deletes all notifications successfully', async () => {
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 3 });

      const res = await service.deleteNotificationsBulk(userId, {
        ids: notificationIds,
      } as any);

      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds },
          userId,
        },
      });
      expect(res).toEqual({
        success: true,
        message: '3 notifications deleted successfully',
        data: {
          deletedCount: 3,
          totalRequested: 3,
          notFoundCount: 0,
        },
      });
    });

    it('deletes some notifications successfully (partial match)', async () => {
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 2 });

      const res = await service.deleteNotificationsBulk(userId, {
        ids: notificationIds,
      } as any);

      expect(res).toEqual({
        success: true,
        message: '2 notifications deleted successfully',
        data: {
          deletedCount: 2,
          totalRequested: 3,
          notFoundCount: 1,
        },
      });
    });

    it('throws NotFoundException when no notifications are found', async () => {
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.deleteNotificationsBulk(userId, {
          ids: notificationIds,
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds },
          userId,
        },
      });
    });

    it('handles single notification deletion with correct grammar', async () => {
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.deleteNotificationsBulk(userId, {
        ids: ['n1'],
      } as any);

      expect(res.message).toBe('1 notification deleted successfully');
    });

    it('wraps unknown errors as InternalServerErrorException', async () => {
      prismaMock.notification.deleteMany.mockRejectedValue(
        new Error('DB fail'),
      );

      await expect(
        service.deleteNotificationsBulk(userId, {
          ids: notificationIds,
        } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('preserves NotFoundException when thrown', async () => {
      const notFoundError = new NotFoundException('Custom not found');
      prismaMock.notification.deleteMany.mockRejectedValue(notFoundError);

      await expect(
        service.deleteNotificationsBulk(userId, {
          ids: notificationIds,
        } as any),
      ).rejects.toBe(notFoundError);
    });

    it('handles empty IDs array', async () => {
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.deleteNotificationsBulk(userId, {
          ids: [],
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('handles large number of IDs', async () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => `n${i + 1}`);
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 100 });

      const res = await service.deleteNotificationsBulk(userId, {
        ids: manyIds,
      } as any);

      expect(res.data.deletedCount).toBe(100);
      expect(res.data.totalRequested).toBe(100);
      expect(res.data.notFoundCount).toBe(0);
    });
  });
});
