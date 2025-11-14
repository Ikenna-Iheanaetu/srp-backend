import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../utils/minio.utils';
import { EmailService } from '../email/email.service';
import { CodeGeneratorService, OtpUtilsService } from 'src/utils';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AffiliateType, AffiliateStatus, OtpType } from '@prisma/client';
import { MetricsPeriod } from './dto/get-dashboard-metrics-query.dto';

jest.mock('../utils/minio.utils', () => ({
  MinioService: class MockMinioService {
    uploadFile = jest.fn();
  },
}));

// Avoid ESM import issues for nanoid via utils barrel
jest.mock('src/utils', () => {
  const actual = jest.requireActual('src/utils');
  return {
    ...actual,
    CodeGeneratorService: class {},
    OtpUtilsService: class {},
  };
});

const prismaMock = {
  admin: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  affiliate: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  revenue: {
    aggregate: jest.fn(),
  },
  invoice: {
    aggregate: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  company: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  shortlisted: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  hireRequest: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  chat: {
    findUnique: jest.fn(),
  },
  chatEvent: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const minioMock = {
  uploadFile: jest.fn(),
};

const emailServiceMock = {
  declineAffiliateInviteEmail: jest.fn(),
  sendClubInviteEmail: jest.fn(),
  sendCompanyInviteEmail: jest.fn(),
  sendPlayerSupporterInviteEmail: jest.fn(),
};

const codeGenMock = {
  generateUniqueRefCode: jest.fn().mockReturnValue('ABC123'),
};

const otpUtilsMock = {
  generateAndSaveOtp: jest.fn().mockResolvedValue('654321'),
};

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MinioService, useValue: minioMock },
        { provide: EmailService, useValue: emailServiceMock },
        { provide: CodeGeneratorService, useValue: codeGenMock },
        { provide: OtpUtilsService, useValue: otpUtilsMock },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    // Re-apply default mock implementations cleared by jest between tests
    (codeGenMock.generateUniqueRefCode as jest.Mock).mockReturnValue('ABC123');
    (otpUtilsMock.generateAndSaveOtp as jest.Mock).mockResolvedValue('654321');
  });

  describe('getProfile', () => {
    it('returns profile when admin exists', async () => {
      prismaMock.admin.findUnique.mockResolvedValue({
        id: 'admin1',
        avatar: 'avatar.png',
        user: {
          name: 'Alice',
          email: 'alice@example.com',
          userType: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      const res = await service.getProfile('user-1');

      expect(prismaMock.admin.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          user: {
            select: { email: true, userType: true, status: true, name: true },
          },
        },
      });
      expect(res.success).toBe(true);
      expect(res.data).toMatchObject({
        id: 'admin1',
        name: 'Alice',
        email: 'alice@example.com',
        userType: 'admin',
        avatar: 'avatar.png',
        status: 'active',
      });
    });

    it('throws NotFound when admin is missing', async () => {
      prismaMock.admin.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('user-2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.admin.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.getProfile('user-1')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('updateProfile', () => {
    it('uploads avatar and updates profile', async () => {
      prismaMock.admin.findUnique.mockResolvedValue({ id: 'admin1' });
      (minioMock.uploadFile as jest.Mock).mockResolvedValue({
        publicUrl: 'https://files/avatar.jpg',
        s3Key: 'bucket/key',
      });
      prismaMock.admin.update.mockResolvedValue({});

      const file = {
        originalname: 'avatar.jpg',
      } as unknown as Express.Multer.File;

      const result = await service.updateProfile(
        'user-1',
        {
          name: 'Bob',
          securityQuestion_question: 'q',
          securityQuestion_answer: 'a',
        },
        file,
      );

      expect(minioMock.uploadFile).toHaveBeenCalledWith(
        file,
        'user-1',
        'avatar',
      );
      expect(prismaMock.admin.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: {
          user: {
            update: {
              name: 'Bob',
            },
          },
          avatar: 'https://files/avatar.jpg',
          securityQuestion: {
            update: {
              question: 'q',
              answer: 'a',
            },
          },
        },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Admin profile updated successfully');
    });

    it('updates profile without avatar upload', async () => {
      prismaMock.admin.findUnique.mockResolvedValue({ id: 'admin1' });
      prismaMock.admin.update.mockResolvedValue({});

      const result = await service.updateProfile(
        'user-1',
        {
          name: 'Bob',
          securityQuestion_question: 'q',
          securityQuestion_answer: 'a',
        },
        undefined,
      );

      expect(minioMock.uploadFile).not.toHaveBeenCalled();
      expect(prismaMock.admin.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: {
          user: {
            update: {
              name: 'Bob',
            },
          },
          avatar: undefined,
          securityQuestion: {
            update: {
              question: 'q',
              answer: 'a',
            },
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it('throws NotFoundException when admin not found', async () => {
      prismaMock.admin.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-1', { name: 'Bob' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when file upload fails', async () => {
      prismaMock.admin.findUnique.mockResolvedValue({ id: 'admin1' });
      (minioMock.uploadFile as jest.Mock).mockRejectedValue(
        new Error('Upload failed'),
      );

      const file = {
        originalname: 'avatar.jpg',
      } as unknown as Express.Multer.File;

      await expect(
        service.updateProfile('user-1', { name: 'Bob' }, file),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.admin.findUnique.mockResolvedValue({ id: 'admin1' });
      prismaMock.admin.update.mockRejectedValue(new Error('DB error'));

      await expect(
        service.updateProfile('user-1', { name: 'Bob' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getAffiliates', () => {
    const mockAffiliates = [
      {
        id: 'affiliate1',
        email: 'john@example.com',
        type: AffiliateType.PLAYER,
        status: AffiliateStatus.ACTIVE,
        user: {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          player: {
            id: 'player1',
          },
          company: null,
        },
        club: {
          id: 'club1',
          avatar: 'club-avatar.jpg',
          user: {
            name: 'Sports Club',
          },
        },
      },
      {
        id: 'affiliate2',
        email: 'jane@example.com',
        type: AffiliateType.SUPPORTER,
        status: AffiliateStatus.PENDING,
        user: {
          id: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          player: {
            id: 'player2',
          },
          company: null,
        },
        club: null,
      },
    ];

    it('returns paginated affiliates with default parameters', async () => {
      prismaMock.affiliate.count.mockResolvedValue(50);
      prismaMock.affiliate.findMany.mockResolvedValue(mockAffiliates);

      const result = await service.getAffiliates({});

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          isApproved: true,
          user: { name: { not: null } },
        },
      });

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith({
        where: {
          isApproved: true,
          user: { name: { not: null } },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              player: { select: { id: true } },
              company: { select: { id: true } },
            },
          },
          club: {
            select: {
              id: true,
              user: { select: { name: true } },
              avatar: true,
            },
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(2);
      expect(result.data.data[0]).toMatchObject({
        id: 'player1',
        affiliateId: 'affiliate1',
        name: 'John Doe',
        email: 'john@example.com',
        type: 'player',
        status: 'active',
        club: {
          id: 'club1',
          name: 'Sports Club',
          avatar: 'club-avatar.jpg',
        },
      });
      expect(result.data.meta).toMatchObject({
        total: 50,
        totalPages: 5,
        page: 1,
        limit: 10,
      });
    });

    it('applies search filter correctly', async () => {
      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([mockAffiliates[0]]);

      await service.getAffiliates({ search: 'John' });

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          isApproved: true,
          user: { name: { contains: 'John', mode: 'insensitive' } },
        },
      });
    });

    it('applies status and type filters correctly', async () => {
      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([mockAffiliates[0]]);

      await service.getAffiliates({
        status: AffiliateStatus.ACTIVE,
        type: AffiliateType.PLAYER,
      });

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          isApproved: true,
          type: AffiliateType.PLAYER,
          user: { name: { not: null } },
          status: AffiliateStatus.ACTIVE,
        },
      });
    });

    it('applies clubId filter correctly', async () => {
      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([mockAffiliates[0]]);

      await service.getAffiliates({ clubId: 'club123' });

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          isApproved: true,
          user: { name: { not: null } },
          clubId: 'club123',
        },
      });
    });

    it('handles pagination correctly', async () => {
      prismaMock.affiliate.count.mockResolvedValue(25);
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      await service.getAffiliates({ page: 3, limit: 5 });

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('handles affiliate without club', async () => {
      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([mockAffiliates[1]]);

      const result = await service.getAffiliates({});

      expect(result.data.data[0].club).toBe(null);
    });

    it('handles affiliate without user name', async () => {
      const affiliateWithoutName = {
        ...mockAffiliates[0],
        user: { ...mockAffiliates[0].user, name: null },
      };

      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([affiliateWithoutName]);

      const result = await service.getAffiliates({});

      expect(result.data.data[0].name).toBe('');
    });

    it('handles COMPANY type affiliate correctly', async () => {
      const companyAffiliate = {
        id: 'affiliate3',
        email: 'company@example.com',
        type: AffiliateType.COMPANY,
        status: AffiliateStatus.ACTIVE,
        user: {
          id: 'user3',
          name: 'Company Name',
          email: 'company@example.com',
          player: null,
          company: {
            id: 'company1',
          },
        },
        club: {
          id: 'club1',
          avatar: 'club-avatar.jpg',
          user: {
            name: 'Sports Club',
          },
        },
      };

      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([companyAffiliate]);

      const result = await service.getAffiliates({});

      expect(result.data.data[0]).toMatchObject({
        id: 'company1',
        affiliateId: 'affiliate3',
        name: 'Company Name',
        type: 'company',
      });
    });
  });

  describe('deleteAffiliate', () => {
    const mockAffiliate = {
      id: 'affiliate1',
      userId: 'user1',
      user: {
        id: 'user1',
        player: {
          id: 'player1',
        },
      },
    };

    it('successfully deletes affiliate with all related data', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue(mockAffiliate);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          application: {
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          shortlisted: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          playerBookmark: {
            deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
          experience: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
          player: { delete: jest.fn().mockResolvedValue({}) },
          notification: {
            deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
          },
          refreshToken: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          otpCode: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
          user: { delete: jest.fn().mockResolvedValue({}) },
          affiliate: { delete: jest.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      const result = await service.deleteAffiliate('affiliate1');

      expect(prismaMock.affiliate.findUnique).toHaveBeenCalledWith({
        where: { id: 'affiliate1' },
        include: {
          user: {
            include: expect.objectContaining({
              player: true,
              club: true,
              company: true,
            }),
          },
        },
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Affiliate and all related data deleted successfully',
      );
    });

    it('successfully deletes affiliate without user', async () => {
      const affiliateWithoutUser = {
        id: 'affiliate1',
        userId: null,
        user: null,
      };

      prismaMock.affiliate.findUnique.mockResolvedValue(affiliateWithoutUser);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          otpCode: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
          affiliate: { delete: jest.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      const result = await service.deleteAffiliate('affiliate1');

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Affiliate and all related data deleted successfully',
      );
    });

    it('successfully deletes affiliate without player profile', async () => {
      const affiliateWithoutPlayer = {
        id: 'affiliate1',
        userId: 'user1',
        user: {
          id: 'user1',
          player: null,
        },
      };

      prismaMock.affiliate.findUnique.mockResolvedValue(affiliateWithoutPlayer);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          notification: {
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          refreshToken: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          otpCode: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
          user: { delete: jest.fn().mockResolvedValue({}) },
          affiliate: { delete: jest.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      const result = await service.deleteAffiliate('affiliate1');

      expect(result.success).toBe(true);
    });

    it('throws NotFoundException when affiliate does not exist', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteAffiliate('nonexistent'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerErrorException when transaction fails', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue(mockAffiliate);
      prismaMock.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        service.deleteAffiliate('affiliate1'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('logs deletion process correctly', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      prismaMock.affiliate.findUnique.mockResolvedValue(mockAffiliate);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          application: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          shortlisted: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          playerBookmark: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          experience: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          player: { delete: jest.fn().mockResolvedValue({}) },
          notification: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          refreshToken: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          otpCode: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          user: { delete: jest.fn().mockResolvedValue({}) },
          affiliate: { delete: jest.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      await service.deleteAffiliate('affiliate1');

      expect(logSpy).toHaveBeenCalledWith(
        'Deleting affiliate with id affiliate1',
      );
      expect(logSpy).toHaveBeenCalledWith('Affiliate with id affiliate1 deleted successfully');
    });
  });

  describe('getUnapprovedAffiliates', () => {
    const baseAffiliates = [
      {
        id: 'a1',
        email: 'x@example.com',
        type: AffiliateType.PLAYER,
        status: AffiliateStatus.PENDING,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-02T10:00:00Z'),
        club: {
          id: 'c1',
          user: { name: 'Club One' },
          avatar: 'club.png',
        },
      },
      {
        id: 'a2',
        email: 'y@example.com',
        type: AffiliateType.SUPPORTER,
        status: AffiliateStatus.ACTIVE,
        createdAt: new Date('2025-01-03T10:00:00Z'),
        updatedAt: new Date('2025-01-04T10:00:00Z'),
        club: null,
      },
    ];

    it('returns paginated unapproved affiliates with defaults', async () => {
      prismaMock.affiliate.count.mockResolvedValue(12);
      prismaMock.affiliate.findMany.mockResolvedValue([baseAffiliates[0]]);

      const res = await service.getUnapprovedAffiliates({} as any);

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          isApproved: false,
          user: { isNot: null },
        },
      });
      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith({
        where: {
          isApproved: false,
          user: { isNot: null },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              company: { select: { id: true } },
              player: { select: { id: true } },
            },
          },
          club: {
            select: {
              id: true,
              user: { select: { name: true } },
              avatar: true,
            },
          },
        },
      });

      expect(res.success).toBe(true);
      expect(res.data.data[0]).toMatchObject({
        id: 'a1',
        type: 'player',
        name: '',
        club: { id: 'c1', name: 'Club One', avatar: 'club.png' },
        hasSignedUp: false,
      });
      expect(res.data.meta).toMatchObject({
        total: 12,
        totalPages: 2,
        page: 1,
        limit: 10,
      });
    });

    it('applies invitedAt day filter', async () => {
      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([baseAffiliates[0]]);

      const invitedAt = '2025-01-01';
      await service.getUnapprovedAffiliates({ invitedAt } as any);

      const whereUsed = prismaMock.affiliate.count.mock.calls[0][0].where;
      expect(whereUsed.isApproved).toBe(false);
      expect(whereUsed.createdAt.gte).toEqual(new Date(invitedAt));
      const nextDay = new Date(invitedAt);
      nextDay.setDate(nextDay.getDate() + 1);
      expect(whereUsed.createdAt.lt).toEqual(nextDay);
    });

    it('applies clubId filter', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      await service.getUnapprovedAffiliates({ clubId: 'club123' } as any);

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          isApproved: false,
          clubId: 'club123',
          user: { isNot: null },
        },
      });
    });

    it('applies search filter on email and club name', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      await service.getUnapprovedAffiliates({ search: 'john' } as any);

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          isApproved: false,
          user: { isNot: null },
          OR: [
            { email: { contains: 'john', mode: 'insensitive' } },
            {
              user: {
                name: { contains: 'john', mode: 'insensitive' },
              },
            },
            {
              club: {
                user: { name: { contains: 'john', mode: 'insensitive' } },
              },
            },
          ],
        },
      });
    });

    it('handles pagination params', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      await service.getUnapprovedAffiliates({ page: 3, limit: 5 } as any);

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('wraps unexpected errors', async () => {
      prismaMock.affiliate.count.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getUnapprovedAffiliates({} as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('handles COMPANY type affiliate correctly', async () => {
      const companyAffiliate = {
        id: 'a3',
        email: 'company@example.com',
        type: AffiliateType.COMPANY,
        status: AffiliateStatus.PENDING,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-02T10:00:00Z'),
        user: {
          id: 'user3',
          name: 'Company Name',
          company: {
            id: 'company1',
          },
          player: null,
        },
        club: {
          id: 'c1',
          user: { name: 'Club One' },
          avatar: 'club.png',
        },
      };

      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([companyAffiliate]);

      const result = await service.getUnapprovedAffiliates({} as any);

      expect(result.data.data[0]).toMatchObject({
        id: 'a3',
        profileId: 'company1',
        type: 'company',
        name: 'Company Name',
      });
    });

    it('handles affiliate with club but null user name', async () => {
      const affiliateWithNullUserName = {
        id: 'a4',
        email: 'test@example.com',
        type: AffiliateType.PLAYER,
        status: AffiliateStatus.PENDING,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-02T10:00:00Z'),
        user: {
          id: 'user4',
          name: null,
          company: null,
          player: {
            id: 'player1',
          },
        },
        club: {
          id: 'c1',
          user: { name: 'Club One' },
          avatar: 'club.png',
        },
      };

      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([
        affiliateWithNullUserName,
      ]);

      const result = await service.getUnapprovedAffiliates({} as any);

      expect(result.data.data[0].name).toBe('');
    });
  });

  describe('updateInvite', () => {
    const emailSvc = () => (service as any)['emailService'] as EmailService;

    it('approves invite and updates affiliate', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue({
        id: 'a1',
        email: 'x@e.com',
      });
      prismaMock.affiliate.update.mockResolvedValue({});

      const res = await service.updateInvite('a1', {
        status: 'approved',
      } as any);

      expect(prismaMock.affiliate.findUnique).toHaveBeenCalledWith({
        where: { id: 'a1' },
        include: { user: true },
      });
      expect(prismaMock.affiliate.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { isApproved: true, status: AffiliateStatus.ACTIVE },
      });
      expect((res as any).success).toBe(true);
      expect((res as any).message).toBe('Invite approved');
    });

    it('declines invite, deletes records, and sends email', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue({
        id: 'a1',
        email: 'x@e.com',
        userId: 'u1',
      });

      const declineSpy = jest
        .spyOn(emailSvc(), 'declineAffiliateInviteEmail')
        .mockResolvedValue(undefined as any);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          affiliate: { delete: jest.fn().mockResolvedValue({}) },
          user: { delete: jest.fn().mockResolvedValue({}) },
        } as any;
        return callback(txMock);
      });

      const res = await service.updateInvite('a1', {
        status: 'declined',
      } as any);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      const txArg = prismaMock.$transaction.mock.calls[0][0];
      const tx = {
        affiliate: { delete: jest.fn() },
        user: { delete: jest.fn() },
      } as any;
      await txArg(tx);
      expect(tx.affiliate.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
      expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(declineSpy).toHaveBeenCalledWith('x@e.com');
      expect((res as any).success).toBe(true);
      expect((res as any).message).toBe('Invite declined');
    });

    it('declines invite when no userId and only deletes affiliate', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue({
        id: 'a1',
        email: 'x@e.com',
        userId: null,
      });
      const declineSpy = jest
        .spyOn(emailSvc(), 'declineAffiliateInviteEmail')
        .mockResolvedValue(undefined as any);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          affiliate: { delete: jest.fn().mockResolvedValue({}) },
          user: { delete: jest.fn().mockResolvedValue({}) },
        } as any;
        return callback(txMock);
      });

      await service.updateInvite('a1', { status: 'declined' } as any);
      const txArg = prismaMock.$transaction.mock.calls[0][0];
      const tx = {
        affiliate: { delete: jest.fn() },
        user: { delete: jest.fn() },
      } as any;
      await txArg(tx);
      expect(tx.affiliate.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
      expect(tx.user.delete).not.toHaveBeenCalled();
      expect(declineSpy).toHaveBeenCalledWith('x@e.com');
    });

    it('throws NotFoundException when invite not found', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue(null);
      await expect(
        service.updateInvite('missing', { status: 'approved' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('wraps unknown errors as InternalServerErrorException', async () => {
      prismaMock.affiliate.findUnique.mockRejectedValue(new Error('DB'));
      await expect(
        service.updateInvite('a1', { status: 'approved' } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getUnclaimedAffiliates', () => {
    const mockUnclaimedAffiliates = [
      {
        id: 'unclaimed1',
        email: 'unclaimed@example.com',
        type: AffiliateType.PLAYER,
        status: AffiliateStatus.PENDING,
        userId: undefined,
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-05'),
        club: {
          id: 'club1',
          user: { name: 'Test Club' },
          avatar: 'club.png',
        },
      },
    ];

    it('returns paginated unclaimed affiliates with defaults', async () => {
      prismaMock.affiliate.count.mockResolvedValue(5);
      prismaMock.affiliate.findMany.mockResolvedValue(mockUnclaimedAffiliates);

      const result = await service.getUnclaimedAffiliates({} as any);

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          userId: undefined,
          status: AffiliateStatus.PENDING,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0]).toMatchObject({
        id: 'unclaimed1',
        email: 'unclaimed@example.com',
        type: 'player',
        status: 'pending',
      });
    });

    it('applies invitedAt filter', async () => {
      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      await service.getUnclaimedAffiliates({ invitedAt: '2025-01-05' } as any);

      const whereUsed = prismaMock.affiliate.count.mock.calls[0][0].where;
      expect(whereUsed.createdAt.gte).toEqual(new Date('2025-01-05'));
      const nextDay = new Date('2025-01-05');
      nextDay.setDate(nextDay.getDate() + 1);
      expect(whereUsed.createdAt.lt).toEqual(nextDay);
    });

    it('applies search filter on email and club name', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      await service.getUnclaimedAffiliates({ search: 'test' } as any);

      expect(prismaMock.affiliate.count).toHaveBeenCalledWith({
        where: {
          userId: undefined,
          status: AffiliateStatus.PENDING,
          OR: [
            { email: { contains: 'test', mode: 'insensitive' } },
            {
              club: {
                user: { name: { contains: 'test', mode: 'insensitive' } },
              },
            },
          ],
        },
      });
    });

    it('handles pagination correctly', async () => {
      prismaMock.affiliate.count.mockResolvedValue(25);
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      await service.getUnclaimedAffiliates({ page: 2, limit: 5 } as any);

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.affiliate.count.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getUnclaimedAffiliates({} as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('resendInvite', () => {
    const mockAffiliate = {
      id: 'aff1',
      email: 'player@example.com',
      type: AffiliateType.PLAYER,
      userId: null,
      status: AffiliateStatus.PENDING,
      club: {
        id: 'club1',
        refCode: 'REF123',
        user: { name: 'Test Club' },
      },
    };

    it('resends invite for PLAYER affiliate', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue(mockAffiliate);

      const result = await service.resendInvite('aff1');

      expect(otpUtilsMock.generateAndSaveOtp).toHaveBeenCalledWith(
        'player@example.com',
        OtpType.AFFILIATE_INVITE,
        undefined,
        'aff1',
      );
      expect(
        emailServiceMock.sendPlayerSupporterInviteEmail,
      ).toHaveBeenCalledWith(
        'player@example.com',
        'player',
        'Test Club',
        'REF123',
        '654321',
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Invite has been resent successfully');
    });

    it('resends invite for SUPPORTER affiliate', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue({
        ...mockAffiliate,
        type: AffiliateType.SUPPORTER,
      });

      await service.resendInvite('aff1');

      expect(
        emailServiceMock.sendPlayerSupporterInviteEmail,
      ).toHaveBeenCalledWith(
        'player@example.com',
        'supporter',
        'Test Club',
        'REF123',
        '654321',
      );
    });

    it('resends invite for COMPANY affiliate', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue({
        ...mockAffiliate,
        type: AffiliateType.COMPANY,
      });

      await service.resendInvite('aff1');

      expect(emailServiceMock.sendCompanyInviteEmail).toHaveBeenCalledWith(
        'player@example.com',
        'Test Club',
        'REF123',
        '654321',
      );
    });

    it('throws NotFoundException when affiliate not found', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue(null);

      await expect(service.resendInvite('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException when invite already claimed', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue({
        ...mockAffiliate,
        userId: 'user1',
        status: AffiliateStatus.ACTIVE,
      });

      await expect(service.resendInvite('aff1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws InternalServerErrorException when affiliate not linked to club', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue({
        ...mockAffiliate,
        club: null,
      });

      await expect(service.resendInvite('aff1')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('throws BadRequestException for invalid affiliate type', async () => {
      prismaMock.affiliate.findUnique.mockResolvedValue({
        ...mockAffiliate,
        type: 'INVALID_TYPE' as any,
      });

      await expect(service.resendInvite('aff1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(emailServiceMock.sendCompanyInviteEmail).not.toHaveBeenCalled();
      expect(
        emailServiceMock.sendPlayerSupporterInviteEmail,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getDashboardMetrics', () => {
    beforeEach(() => {
      prismaMock.revenue.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
      prismaMock.invoice.aggregate.mockResolvedValue({ _sum: { amount: 2000 } });
      prismaMock.company.count.mockResolvedValue(10);
      prismaMock.shortlisted.count.mockResolvedValue(5);
      prismaMock.user.count.mockResolvedValue(50);
    });

    it('fetches metrics for LAST_WEEK period', async () => {
      const result = await service.getDashboardMetrics({ period: MetricsPeriod.LAST_WEEK });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalRevenue');
      expect(result.data).toHaveProperty('totalInvoiced');
      expect(result.data).toHaveProperty('companySignups');
      expect(result.data).toHaveProperty('companyHires');
      expect(result.data).toHaveProperty('totalUsers');
    });

    it('calculates percentage change correctly', async () => {
      prismaMock.revenue.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 2000 } })
        .mockResolvedValueOnce({ _sum: { amount: 1000 } });

      const result = await service.getDashboardMetrics({ period: MetricsPeriod.TODAY });

      expect(result.data.totalRevenue.current).toBe(2000);
      expect(result.data.totalRevenue.previous).toBe(1000);
      expect(result.data.totalRevenue.percentageChange).toBe(100);
    });

    it('handles zero previous value', async () => {
      prismaMock.revenue.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1000 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });

      const result = await service.getDashboardMetrics({ period: MetricsPeriod.TODAY });

      expect(result.data.totalRevenue.percentageChange).toBe(0);
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.revenue.aggregate.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getDashboardMetrics({ period: MetricsPeriod.TODAY }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('updateInvoiceStatus', () => {
    it('updates invoice status to PAID', async () => {
      prismaMock.invoice.findUnique.mockResolvedValue({
        id: 'inv1',
        status: 'PENDING',
        paidAt: null,
      });
      prismaMock.invoice.update.mockResolvedValue({});

      const result = await service.updateInvoiceStatus('inv1', 'PAID' as any);

      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: {
          status: 'PAID',
          paidAt: expect.any(Date),
        },
      });
      expect(result.success).toBe(true);
    });

    it('updates invoice status to PENDING without updating paidAt', async () => {
      const existingPaidAt = new Date('2025-01-01');
      prismaMock.invoice.findUnique.mockResolvedValue({
        id: 'inv1',
        status: 'PAID',
        paidAt: existingPaidAt,
      });
      prismaMock.invoice.update.mockResolvedValue({});

      const result = await service.updateInvoiceStatus(
        'inv1',
        'PENDING' as any,
      );

      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: {
          status: 'PENDING',
          paidAt: existingPaidAt,
        },
      });
      expect(result.success).toBe(true);
    });

    it('throws NotFoundException when invoice not found', async () => {
      prismaMock.invoice.findUnique.mockResolvedValue(null);

      await expect(
        service.updateInvoiceStatus('missing', 'PAID' as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.invoice.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.updateInvoiceStatus('inv1', 'PAID' as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getRequests', () => {
    const mockRequests = [
      {
        id: 'req1',
        requestCode: 'REQ001',
        chatId: 'chat1',
        createdAt: new Date('2025-01-01'),
        status: 'PENDING',
        player: {
          user: {
            id: 'user1',
            name: 'John Player',
          },
        },
        company: {
          user: {
            id: 'user2',
            name: 'Test Company',
          },
        },
        initiator: {
          id: 'user1',
          name: 'John Player',
          userType: 'PLAYER',
        },
        recipient: {
          id: 'user2',
          name: 'Test Company',
          userType: 'COMPANY',
        },
      },
    ];

    it('returns paginated requests with defaults', async () => {
      prismaMock.hireRequest.findMany.mockResolvedValue(mockRequests);
      prismaMock.hireRequest.count.mockResolvedValue(10);

      const result = await service.getRequests({});

      expect(prismaMock.hireRequest.findMany).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0]).toMatchObject({
        id: 'req1',
        requestId: 'REQ001',
        initiator: 'player',
        recipient: 'company',
      });
    });

    it('applies status filter', async () => {
      prismaMock.hireRequest.findMany.mockResolvedValue([]);
      prismaMock.hireRequest.count.mockResolvedValue(0);

      await service.getRequests({ status: 'PENDING' } as any);

      expect(prismaMock.hireRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });

    it('applies requestDate filter', async () => {
      prismaMock.hireRequest.findMany.mockResolvedValue([]);
      prismaMock.hireRequest.count.mockResolvedValue(0);

      await service.getRequests({ requestDate: '2025-01-01' } as any);

      const whereUsed = prismaMock.hireRequest.findMany.mock.calls[0][0].where;
      expect(whereUsed.createdAt.gte).toEqual(new Date('2025-01-01'));
    });

    it('applies search filter', async () => {
      prismaMock.hireRequest.findMany.mockResolvedValue([]);
      prismaMock.hireRequest.count.mockResolvedValue(0);

      await service.getRequests({ search: 'john' } as any);

      const whereUsed = prismaMock.hireRequest.findMany.mock.calls[0][0].where;
      expect(whereUsed.OR).toBeDefined();
    });
  });

  describe('getRequestDetails', () => {
    const mockRequest = {
      id: 'req1',
      requestCode: 'REQ001',
      chatId: 'chat1',
      status: 'PENDING',
      player: {
        user: {
          id: 'user1',
          name: 'John Player',
        },
      },
      company: {
        user: {
          id: 'user2',
          name: 'Test Company',
        },
      },
      initiator: {
        id: 'user1',
        name: 'John Player',
        userType: 'PLAYER',
      },
      recipient: {
        id: 'user2',
        name: 'Test Company',
        userType: 'COMPANY',
      },
      events: [
        {
          eventType: 'DISCUSSION_INITIATED',
          createdAt: new Date('2025-01-01'),
          metadata: {},
        },
      ],
    };

    it('returns request details with events', async () => {
      prismaMock.hireRequest.findUnique.mockResolvedValue(mockRequest);

      const result = await service.getRequestDetails('req1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('req1');
      expect(result.data.events).toHaveLength(1);
    });

    it('throws NotFoundException when request not found', async () => {
      prismaMock.hireRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.getRequestDetails('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.hireRequest.findUnique.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.getRequestDetails('req1'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getChatTimeline', () => {
    const mockEvents = [
      {
        id: 'event1',
        description: 'Test event',
        eventType: 'MESSAGE_SENT',
        createdAt: new Date('2025-01-01'),
      },
    ];

    it('returns chat timeline events', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({ id: 'chat1' });
      prismaMock.chatEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getChatTimeline('chat1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'event1',
        description: 'Test event',
      });
    });

    it('throws NotFoundException when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(service.getChatTimeline('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('uses default event description when not provided', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({ id: 'chat1' });
      prismaMock.chatEvent.findMany.mockResolvedValue([
        {
          id: 'event1',
          description: null,
          eventType: 'DISCUSSION_INITIATED',
          createdAt: new Date('2025-01-01'),
        },
      ]);

      const result = await service.getChatTimeline('chat1');

      expect(result.data[0].description).toBe(
        'Company initiated the discussion',
      );
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({ id: 'chat1' });
      prismaMock.chatEvent.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.getChatTimeline('chat1')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getDashboard', () => {
    const mockMetricsData = {
      data: {
        totalRevenue: { current: 5000, previous: 4000, percentageChange: 25 },
        totalInvoiced: {
          current: 10000,
          previous: 8000,
          percentageChange: 25,
        },
        companySignups: { current: 10, previous: 8, percentageChange: 25 },
        companyHires: { current: 5, previous: 4, percentageChange: 25 },
        totalUsers: { current: 50, previous: 40, percentageChange: 25 },
      },
    };

    const mockHireHistoryData = {
      data: {
        data: [
          {
            id: 'hire1',
            playerName: 'John Player',
            playerEmail: 'john@example.com',
            companyName: 'Test Company',
            companyId: 'company1',
            clubName: 'Test Club',
            clubAvatar: 'club.png',
            clubId: 'club1',
            invoiceCode: 'INV001',
            invoiceId: 'inv1',
            amount: 300,
            hiredAt: '2025-01-01',
          },
        ],
      },
    };

    const mockNewCompaniesData = {
      data: {
        data: [
          {
            id: 'company1',
            name: 'New Company',
            email: 'company@example.com',
            industry: 'Tech',
            status: 'active',
            signupDate: '2025-01-01',
          },
        ],
      },
    };

    beforeEach(() => {
      jest
        .spyOn(service as any, 'getDashboardMetricsInternal')
        .mockResolvedValue(mockMetricsData);
      jest
        .spyOn(service as any, 'getHireHistoryInternal')
        .mockResolvedValue(mockHireHistoryData);
      jest
        .spyOn(service as any, 'getNewCompaniesInternal')
        .mockResolvedValue(mockNewCompaniesData);
    });

    it('fetches combined dashboard data successfully', async () => {
      const result = await service.getDashboard({
        period: 'LAST_WEEK' as any,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Dashboard data fetched successfully');
      expect(result.data).toMatchObject({
        metrics: mockMetricsData.data,
        hireHistory: mockHireHistoryData.data.data,
        newCompanies: mockNewCompaniesData.data.data,
      });
    });

    it('calls internal methods with correct parameters', async () => {
      const getDashboardMetricsSpy = jest.spyOn(
        service as any,
        'getDashboardMetricsInternal',
      );
      const getHireHistorySpy = jest.spyOn(
        service as any,
        'getHireHistoryInternal',
      );
      const getNewCompaniesSpy = jest.spyOn(
        service as any,
        'getNewCompaniesInternal',
      );

      await service.getDashboard({
        period: 'TODAY' as any,
        hireHistoryPage: 2,
        hireHistoryLimit: 10,
        hireHistorySearch: 'john',
        hireHistoryHiredAt: '2025-01-01',
        newCompaniesPage: 3,
        newCompaniesLimit: 5,
        newCompaniesSearch: 'tech',
        newCompaniesSignupDate: '2025-01-02',
        newCompaniesStatus: 'ACTIVE' as any,
      });

      expect(getDashboardMetricsSpy).toHaveBeenCalledWith({
        period: 'TODAY',
      });
      expect(getHireHistorySpy).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'john',
        hiredAt: '2025-01-01',
      });
      expect(getNewCompaniesSpy).toHaveBeenCalledWith({
        page: 3,
        limit: 5,
        search: 'tech',
        signupDate: '2025-01-02',
        status: 'ACTIVE',
      });
    });

    it('uses default pagination values when not provided', async () => {
      const getHireHistorySpy = jest.spyOn(
        service as any,
        'getHireHistoryInternal',
      );
      const getNewCompaniesSpy = jest.spyOn(
        service as any,
        'getNewCompaniesInternal',
      );

      await service.getDashboard({ period: 'LAST_WEEK' as any });

      expect(getHireHistorySpy).toHaveBeenCalledWith({
        page: 1,
        limit: 5,
        search: undefined,
        hiredAt: undefined,
      });
      expect(getNewCompaniesSpy).toHaveBeenCalledWith({
        page: 1,
        limit: 2,
        search: undefined,
        signupDate: undefined,
        status: undefined,
      });
    });

    it('wraps errors as InternalServerErrorException', async () => {
      jest
        .spyOn(service as any, 'getDashboardMetricsInternal')
        .mockRejectedValue(new Error('DB error'));

      await expect(
        service.getDashboard({ period: 'LAST_WEEK' as any }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getHireHistory', () => {
    const mockHires = [
      {
        id: 'hire1',
        hiredAt: new Date('2025-01-01'),
        player: {
          clubId: 'club1',
          user: {
            name: 'John Player',
            email: 'john@example.com',
          },
          club: {
            avatar: 'club.png',
            user: {
              name: 'Test Club',
            },
          },
        },
        job: {
          companyId: 'company1',
          company: {
            user: {
              name: 'Test Company',
            },
          },
        },
        invoiceId: 'inv1',
        invoice: {
          invoiceCode: 'INV001',
          amount: 1000,
        },
      },
    ];

    it('returns paginated hire history with defaults', async () => {
      prismaMock.shortlisted.count.mockResolvedValue(10);
      prismaMock.shortlisted.findMany.mockResolvedValue(mockHires);

      const result = await service.getHireHistory({});

      expect(prismaMock.shortlisted.count).toHaveBeenCalledWith({
        where: {
          status: 'HIRED',
          hiredAt: { not: null },
        },
      });
      expect(prismaMock.shortlisted.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { hiredAt: 'desc' },
        }),
      );
      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0]).toMatchObject({
        id: 'hire1',
        playerName: 'John Player',
        playerEmail: 'john@example.com',
        companyName: 'Test Company',
        companyId: 'company1',
        clubName: 'Test Club',
        amount: 300, // 1000 * 0.3
      });
    });

    it('applies hiredAt date filter', async () => {
      prismaMock.shortlisted.count.mockResolvedValue(0);
      prismaMock.shortlisted.findMany.mockResolvedValue([]);

      await service.getHireHistory({ hiredAt: '2025-01-01' });

      const whereUsed = prismaMock.shortlisted.count.mock.calls[0][0].where;
      expect(whereUsed.hiredAt.gte).toEqual(new Date('2025-01-01'));
      const nextDay = new Date('2025-01-01');
      nextDay.setDate(nextDay.getDate() + 1);
      expect(whereUsed.hiredAt.lt).toEqual(nextDay);
    });

    it('applies search filter on player, company, and club names', async () => {
      prismaMock.shortlisted.count.mockResolvedValue(0);
      prismaMock.shortlisted.findMany.mockResolvedValue([]);

      await service.getHireHistory({ search: 'john' });

      const whereUsed = prismaMock.shortlisted.count.mock.calls[0][0].where;
      expect(whereUsed.OR).toHaveLength(3);
      expect(whereUsed.OR[0]).toMatchObject({
        player: {
          user: {
            name: {
              contains: 'john',
              mode: 'insensitive',
            },
          },
        },
      });
    });

    it('handles pagination correctly', async () => {
      prismaMock.shortlisted.count.mockResolvedValue(25);
      prismaMock.shortlisted.findMany.mockResolvedValue([]);

      await service.getHireHistory({ page: 3, limit: 5 });

      expect(prismaMock.shortlisted.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('handles hire without invoice', async () => {
      const hireWithoutInvoice = {
        ...mockHires[0],
        invoice: null,
        invoiceId: null,
      };
      prismaMock.shortlisted.count.mockResolvedValue(1);
      prismaMock.shortlisted.findMany.mockResolvedValue([hireWithoutInvoice]);

      const result = await service.getHireHistory({});

      expect(result.data.data[0].amount).toBe(0);
      expect(result.data.data[0].invoiceCode).toBe('');
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.shortlisted.count.mockRejectedValue(new Error('DB error'));

      await expect(service.getHireHistory({})).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getNewCompanies', () => {
    const mockCompanies = [
      {
        id: 'company1',
        industry: 'Technology',
        createdAt: new Date('2025-01-01'),
        user: {
          name: 'Tech Corp',
          email: 'tech@example.com',
          status: 'ACTIVE',
        },
      },
      {
        id: 'company2',
        industry: 'Healthcare',
        createdAt: new Date('2025-01-02'),
        user: {
          name: 'Health Inc',
          email: 'health@example.com',
          status: 'INACTIVE',
        },
      },
    ];

    it('returns paginated new companies with defaults', async () => {
      prismaMock.company.count.mockResolvedValue(15);
      prismaMock.company.findMany.mockResolvedValue(mockCompanies);

      const result = await service.getNewCompanies({});

      expect(prismaMock.company.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(prismaMock.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(2);
      expect(result.data.data[0]).toMatchObject({
        id: 'company1',
        name: 'Tech Corp',
        email: 'tech@example.com',
        industry: 'Technology',
        status: 'active',
        signupDate: '2025-01-01',
      });
    });

    it('applies status filter', async () => {
      prismaMock.company.count.mockResolvedValue(0);
      prismaMock.company.findMany.mockResolvedValue([]);

      await service.getNewCompanies({ status: 'ACTIVE' as any });

      const whereUsed = prismaMock.company.count.mock.calls[0][0].where;
      expect(whereUsed.user).toMatchObject({
        status: 'ACTIVE',
      });
    });

    it('applies signupDate filter', async () => {
      prismaMock.company.count.mockResolvedValue(0);
      prismaMock.company.findMany.mockResolvedValue([]);

      await service.getNewCompanies({ signupDate: '2025-01-01' });

      const whereUsed = prismaMock.company.count.mock.calls[0][0].where;
      expect(whereUsed.createdAt.gte).toEqual(new Date('2025-01-01'));
      const nextDay = new Date('2025-01-01');
      nextDay.setDate(nextDay.getDate() + 1);
      expect(whereUsed.createdAt.lt).toEqual(nextDay);
    });

    it('applies search filter on company name', async () => {
      prismaMock.company.count.mockResolvedValue(0);
      prismaMock.company.findMany.mockResolvedValue([]);

      await service.getNewCompanies({ search: 'tech' });

      const whereUsed = prismaMock.company.count.mock.calls[0][0].where;
      expect(whereUsed.user.name).toMatchObject({
        contains: 'tech',
        mode: 'insensitive',
      });
    });

    it('handles pagination correctly', async () => {
      prismaMock.company.count.mockResolvedValue(30);
      prismaMock.company.findMany.mockResolvedValue([]);

      await service.getNewCompanies({ page: 2, limit: 15 });

      expect(prismaMock.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 15,
        }),
      );
    });

    it('handles company with missing user data', async () => {
      const companyWithoutUser = {
        ...mockCompanies[0],
        user: {
          name: null,
          email: 'test@example.com',
          status: null,
        },
      };
      prismaMock.company.count.mockResolvedValue(1);
      prismaMock.company.findMany.mockResolvedValue([companyWithoutUser]);

      const result = await service.getNewCompanies({});

      expect(result.data.data[0].name).toBe('');
      expect(result.data.data[0].status).toBe('');
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.company.count.mockRejectedValue(new Error('DB error'));

      await expect(service.getNewCompanies({})).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getInvoices', () => {
    const mockClubInvoices = [
      {
        id: 'inv1',
        invoiceCode: 'INV001',
        amount: 1000,
        status: 'PAID',
        createdAt: new Date('2025-01-01'),
        clubId: 'club1',
        companyId: 'company1',
        club: {
          avatar: 'club.png',
          user: {
            name: 'Test Club',
          },
        },
        company: {
          user: {
            name: 'Test Company',
          },
        },
      },
    ];

    const mockCompanyInvoices = [
      {
        id: 'short1',
        invoiceId: 'inv2',
        player: {
          clubId: 'club1',
          user: {
            name: 'John Player',
            email: 'john@example.com',
          },
          club: {
            avatar: 'club.png',
            user: {
              name: 'Test Club',
            },
          },
        },
        job: {
          companyId: 'company1',
          company: {
            user: {
              name: 'Test Company',
            },
          },
        },
        invoice: {
          invoiceCode: 'INV002',
          amount: 2000,
          status: 'PENDING',
          createdAt: new Date('2025-01-02'),
        },
      },
    ];

    it('returns club invoices when tab is CLUB', async () => {
      prismaMock.invoice.count.mockResolvedValue(5);
      prismaMock.invoice.findMany.mockResolvedValue(mockClubInvoices);

      const result = await service.getInvoices({ tab: 'CLUB' as any });

      expect(prismaMock.invoice.count).toHaveBeenCalledWith({
        where: {
          clubId: { not: null },
        },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Club invoices fetched successfully');
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0]).toMatchObject({
        id: 'inv1',
        invoiceCode: 'INV001',
        amount: 300, // 1000 * 0.3
        status: 'PAID',
      });
    });

    it('returns company invoices when tab is COMPANY', async () => {
      prismaMock.shortlisted.count.mockResolvedValue(3);
      prismaMock.shortlisted.findMany.mockResolvedValue(mockCompanyInvoices);

      const result = await service.getInvoices({ tab: 'COMPANY' as any });

      expect(prismaMock.shortlisted.count).toHaveBeenCalledWith({
        where: {
          status: 'HIRED',
          invoice: { isNot: null },
        },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Invoices fetched successfully');
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0]).toMatchObject({
        id: 'short1',
        invoiceCode: 'INV002',
        amount: 600, // 2000 * 0.3
        playerName: 'John Player',
      });
    });

    it('applies status filter for club invoices', async () => {
      prismaMock.invoice.count.mockResolvedValue(0);
      prismaMock.invoice.findMany.mockResolvedValue([]);

      await service.getInvoices({ tab: 'CLUB' as any, status: 'PAID' });

      const whereUsed = prismaMock.invoice.count.mock.calls[0][0].where;
      expect(whereUsed.status).toBe('PAID');
    });

    it('applies invoiceDate filter for club invoices', async () => {
      prismaMock.invoice.count.mockResolvedValue(0);
      prismaMock.invoice.findMany.mockResolvedValue([]);

      await service.getInvoices({
        tab: 'CLUB' as any,
        invoiceDate: '2025-01-01',
      });

      const whereUsed = prismaMock.invoice.count.mock.calls[0][0].where;
      expect(whereUsed.createdAt.gte).toEqual(new Date('2025-01-01'));
    });

    it('applies search filter for club invoices', async () => {
      prismaMock.invoice.count.mockResolvedValue(0);
      prismaMock.invoice.findMany.mockResolvedValue([]);

      await service.getInvoices({ tab: 'CLUB' as any, search: 'test' });

      const whereUsed = prismaMock.invoice.count.mock.calls[0][0].where;
      expect(whereUsed.OR).toHaveLength(3);
    });

    it('applies status filter for company invoices', async () => {
      prismaMock.shortlisted.count.mockResolvedValue(0);
      prismaMock.shortlisted.findMany.mockResolvedValue([]);

      await service.getInvoices({ tab: 'COMPANY' as any, status: 'PENDING' });

      const whereUsed = prismaMock.shortlisted.count.mock.calls[0][0].where;
      expect(whereUsed.invoice.status).toBe('PENDING');
    });

    it('handles pagination correctly', async () => {
      prismaMock.invoice.count.mockResolvedValue(25);
      prismaMock.invoice.findMany.mockResolvedValue([]);

      await service.getInvoices({ tab: 'CLUB' as any, page: 3, limit: 5 });

      expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.invoice.count.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getInvoices({ tab: 'CLUB' as any }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getInvoiceStats', () => {
    it('returns invoice statistics for all tabs', async () => {
      prismaMock.invoice.count
        .mockResolvedValueOnce(10) // paid
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(20); // total

      const result = await service.getInvoiceStats();

      expect(prismaMock.invoice.count).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        paidCount: 10,
        pendingCount: 5,
        totalCount: 20,
      });
    });

    it('filters by COMPANY tab', async () => {
      prismaMock.invoice.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(10);

      await service.getInvoiceStats('COMPANY' as any);

      const calls = prismaMock.invoice.count.mock.calls;
      expect(calls[0][0].where.clubId).toEqual(null);
      expect(calls[1][0].where.clubId).toEqual(null);
      expect(calls[2][0].where.clubId).toEqual(null);
    });

    it('filters by CLUB tab', async () => {
      prismaMock.invoice.count
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(12);

      await service.getInvoiceStats('CLUB' as any);

      const calls = prismaMock.invoice.count.mock.calls;
      expect(calls[0][0].where.clubId).toEqual({ not: null });
      expect(calls[1][0].where.clubId).toEqual({ not: null });
      expect(calls[2][0].where.clubId).toEqual({ not: null });
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.invoice.count.mockRejectedValue(new Error('DB error'));

      await expect(service.getInvoiceStats()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('exportInvoices', () => {
    const mockClubInvoices = [
      {
        id: 'inv1',
        invoiceCode: 'INV001',
        amount: 1000,
        status: 'PAID',
        createdAt: new Date('2025-01-01'),
        clubId: 'club1',
        companyId: 'company1',
        club: {
          avatar: 'club.png',
          user: {
            name: 'Test Club',
          },
        },
        company: {
          user: {
            name: 'Test Company',
          },
        },
      },
    ];

    const mockCompanyInvoices = [
      {
        id: 'short1',
        invoiceId: 'inv2',
        player: {
          clubId: 'club1',
          user: {
            name: 'John Player',
            email: 'john@example.com',
          },
          club: {
            avatar: 'club.png',
            user: {
              name: 'Test Club',
            },
          },
        },
        job: {
          companyId: 'company1',
          company: {
            user: {
              name: 'Test Company',
            },
          },
        },
        invoice: {
          invoiceCode: 'INV002',
          amount: 2000,
          status: 'PENDING',
          createdAt: new Date('2025-01-02'),
        },
      },
    ];

    it('exports club invoices successfully', async () => {
      prismaMock.invoice.findMany.mockResolvedValue(mockClubInvoices);

      const result = await service.exportInvoices({
        tab: 'CLUB' as any,
        format: 'csv',
      });

      expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Club invoices exported successfully');
      expect(result.data).toHaveLength(1);
    });

    it('exports company invoices successfully', async () => {
      prismaMock.shortlisted.findMany.mockResolvedValue(mockCompanyInvoices);

      const result = await service.exportInvoices({
        tab: 'COMPANY' as any,
        format: 'csv',
      });

      expect(prismaMock.shortlisted.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Invoices exported successfully');
      expect(result.data).toHaveLength(1);
    });

    it('applies filters when exporting club invoices', async () => {
      prismaMock.invoice.findMany.mockResolvedValue([]);

      await service.exportInvoices({
        tab: 'CLUB' as any,
        format: 'csv',
        status: 'PAID',
        invoiceDate: '2025-01-01',
        search: 'test',
      });

      const whereUsed = prismaMock.invoice.findMany.mock.calls[0][0].where;
      expect(whereUsed.clubId).toEqual({ not: null });
      expect(whereUsed.status).toBe('PAID');
      expect(whereUsed.createdAt).toBeDefined();
      expect(whereUsed.OR).toBeDefined();
    });

    it('handles cursor-based pagination for large datasets', async () => {
      const createMockInvoices = (count: number) =>
        Array.from({ length: count }, (_, i) => ({
          ...mockClubInvoices[0],
          id: `inv${i}`,
        }));

      // First batch
      prismaMock.invoice.findMany
        .mockResolvedValueOnce(createMockInvoices(1000))
        .mockResolvedValueOnce(createMockInvoices(500));

      const result = await service.exportInvoices({
        tab: 'CLUB' as any,
        format: 'csv',
      });

      expect(prismaMock.invoice.findMany).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(1500);
    });

    it('wraps errors as InternalServerErrorException', async () => {
      prismaMock.invoice.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        service.exportInvoices({ tab: 'CLUB' as any, format: 'csv' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
