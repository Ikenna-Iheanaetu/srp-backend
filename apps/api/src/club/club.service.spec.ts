import { Test, TestingModule } from '@nestjs/testing';
import { ClubService } from './club.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { CodeGeneratorService, OtpUtilsService, MinioService } from 'src/utils';
// Stub utils barrel to avoid importing nanoid ESM during tests, but keep utility functions
jest.mock('src/utils', () => {
  const actual = jest.requireActual('src/utils');
  return {
    ...actual,
    CodeGeneratorService: class {},
    OtpUtilsService: class {},
    MinioService: class {},
  };
});
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AffiliateType, UserStatus, UserType } from '@prisma/client';

// We'll mock util services via providers

const prismaMock = {
  club: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  affiliate: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  clubUpdate: {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  notification: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  player: {
    updateMany: jest.fn(),
  },
  job: {
    findMany: jest.fn(),
  },
  company: {
    findMany: jest.fn(),
  },
  shortlisted: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  savedAffiliate: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const emailServiceMock = {
  sendClubInviteEmail: jest.fn(),
  sendCompanyInviteEmail: jest.fn(),
  sendPlayerSupporterInviteEmail: jest.fn(),
  declineAffiliateInviteEmail: jest.fn(),
  clubUpdateEmail: jest.fn(),
};

const codeGenMock = {
  generateUniqueRefCode: jest.fn().mockReturnValue('ABC123'),
};

const otpUtilsMock = {
  generateAndSaveOtp: jest.fn().mockResolvedValue('123456'),
};

const minioServiceMock = {
  uploadFile: jest
    .fn()
    .mockResolvedValue({ publicUrl: 'https://cdn.test/file.jpg' }),
};

describe('ClubService', () => {
  let service: ClubService;

  beforeEach(async () => {
    // Only clear call history, not implementations
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmailService, useValue: emailServiceMock },
        { provide: CodeGeneratorService, useValue: codeGenMock },
        { provide: OtpUtilsService, useValue: otpUtilsMock },
        { provide: MinioService, useValue: minioServiceMock },
      ],
    }).compile();

    service = module.get<ClubService>(ClubService);
  });

  describe('getClubs', () => {
    const mockClubs = [
      {
        id: 'club1',
        avatar: 'avatar1.png',
        refCode: 'CLUB001',
        user: { name: 'Sports Club 1' },
        _count: { affiliates: 10 },
      },
      {
        id: 'club2',
        avatar: 'avatar2.png',
        refCode: 'CLUB002',
        user: { name: 'Sports Club 2' },
        _count: { affiliates: 5 },
      },
    ];

    it('should return clubs with proper mapping and pagination', async () => {
      prismaMock.club.count.mockResolvedValue(2);
      prismaMock.club.findMany.mockResolvedValue(mockClubs);

      const result = await service.getClubs({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Clubs fetched successfully');
      expect(result.data.data).toHaveLength(2);

      expect(result.data.data[0]).toMatchObject({
        id: 'club1',
        name: 'Sports Club 1',
        avatar: 'avatar1.png',
        refCode: 'CLUB001',
      });

      expect(result.data.meta).toEqual({
        total: 2,
        totalPages: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should handle search and filters', async () => {
      prismaMock.club.count.mockResolvedValue(1);
      prismaMock.club.findMany.mockResolvedValue([mockClubs[0]]);

      await service.getClubs({
        page: 1,
        limit: 5,
        search: 'Sports',
      });

      expect(prismaMock.club.count).toHaveBeenCalledWith({
        where: {
          user: {
            name: { contains: 'Sports', mode: 'insensitive' },
          },
        },
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      prismaMock.club.count.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.getClubs({ page: 1, limit: 10 }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getPublicClubs', () => {
    const mockPublicClubs = [
      {
        id: 'club1',
        avatar: 'avatar1.jpg',
        refCode: 'CLUB001',
        user: { name: 'Sports Club 1' },
      },
      {
        id: 'club2',
        avatar: 'avatar2.jpg',
        refCode: 'CLUB002',
        user: { name: 'Sports Club 2' },
      },
    ];

    it('should return public clubs with id, avatar, name, and refcode', async () => {
      prismaMock.club.count.mockResolvedValue(2);
      prismaMock.club.findMany.mockResolvedValue(mockPublicClubs);

      const result = await service.getPublicClubs({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Clubs fetched successfully');
      expect(result.data.data).toHaveLength(2);

      expect(result.data.data[0]).toMatchObject({
        id: 'club1',
        name: 'Sports Club 1',
        avatar: 'avatar1.jpg',
        refCode: 'CLUB001',
      });

      expect(result.data.meta).toEqual({
        total: 2,
        totalPages: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should filter by search term', async () => {
      prismaMock.club.count.mockResolvedValue(1);
      prismaMock.club.findMany.mockResolvedValue([mockPublicClubs[0]]);

      await service.getPublicClubs({
        page: 1,
        limit: 10,
        search: 'Sports',
      });

      expect(prismaMock.club.count).toHaveBeenCalledWith({
        where: {
          user: {
            name: { contains: 'Sports', mode: 'insensitive' },
          },
        },
      });
    });

    it('should handle pagination correctly', async () => {
      prismaMock.club.count.mockResolvedValue(25);
      prismaMock.club.findMany.mockResolvedValue(mockPublicClubs);

      const result = await service.getPublicClubs({ page: 2, limit: 10 });

      expect(result.data.meta).toEqual({
        total: 25,
        totalPages: 3,
        page: 2,
        limit: 10,
      });

      expect(prismaMock.club.findMany).toHaveBeenCalledWith({
        where: {
          user: {
            name: { not: null },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
        select: {
          id: true,
          avatar: true,
          refCode: true,
          user: {
            select: { name: true },
          },
        },
      });
    });

    it('should use default pagination values', async () => {
      prismaMock.club.count.mockResolvedValue(0);
      prismaMock.club.findMany.mockResolvedValue([]);

      await service.getPublicClubs({});

      expect(prismaMock.club.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      prismaMock.club.count.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.getPublicClubs({ page: 1, limit: 10 }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getClubByRefCode', () => {
    it('should return club data when refCode is valid and club is active', async () => {
      const mockClub = {
        id: 'club123',
        avatar: 'https://cdn.test/avatar.jpg',
        user: {
          name: 'Test Club',
          status: UserStatus.ACTIVE,
        },
      };

      prismaMock.club.findUnique.mockResolvedValue(mockClub);

      const result = await service.getClubByRefCode('ABC123');

      expect(prismaMock.club.findUnique).toHaveBeenCalledWith({
        where: { refCode: 'ABC123' },
        select: {
          id: true,
          avatar: true,
          user: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'Club fetched successfully',
        data: {
          id: 'club123',
          name: 'Test Club',
          avatar: 'https://cdn.test/avatar.jpg',
        },
      });
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.getClubByRefCode('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when club user is not active', async () => {
      const mockClub = {
        id: 'club123',
        avatar: 'https://cdn.test/avatar.jpg',
        user: {
          name: 'Test Club',
          status: UserStatus.PENDING,
        },
      };

      prismaMock.club.findUnique.mockResolvedValue(mockClub);

      await expect(service.getClubByRefCode('ABC123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      prismaMock.club.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(service.getClubByRefCode('ABC123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('inviteClubs', () => {
    beforeEach(() => {
      emailServiceMock.sendClubInviteEmail.mockResolvedValue(true);
    });

    it('should successfully invite new clubs', async () => {
      // Mock the parallel queries for existing users and clubs
      prismaMock.user.findMany.mockResolvedValue([]); // No existing users
      prismaMock.club.findMany.mockResolvedValue([]); // No existing clubs

      // Mock the transaction function
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user123',
              email: 'club1@test.com',
            }),
          },
          club: {
            create: jest.fn().mockResolvedValue({
              id: 'club123',
              refCode: 'ABC123',
            }),
          },
        };
        return await callback(tx);
      });

      const result = await service.inviteClubs({
        emails: ['club1@test.com', 'club2@test.com'],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Club invitations processed');
      expect(result.data.processedEmails).toEqual([
        'club1@test.com',
        'club2@test.com',
      ]);
      expect(result.data.skippedEmails).toHaveLength(0);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
      expect(emailServiceMock.sendClubInviteEmail).toHaveBeenCalledTimes(2);
      expect(otpUtilsMock.generateAndSaveOtp).toHaveBeenCalledTimes(2);
    });

    it('should skip existing users and existing clubs', async () => {
      // Mock existing user
      prismaMock.user.findMany.mockResolvedValue([
        { email: 'existing@test.com' },
      ]);

      // Mock existing club
      prismaMock.club.findMany.mockResolvedValue([
        { user: { email: 'club-exists@test.com' } },
      ]);

      const result = await service.inviteClubs({
        emails: ['existing@test.com', 'club-exists@test.com', 'new@test.com'],
      });

      expect(result.data.processedEmails).toHaveLength(1); // Only new@test.com should be processed
      expect(result.data.skippedEmails).toHaveLength(2);

      const skippedEmails = result.data.skippedEmails.map((s) => s.email);
      expect(skippedEmails).toContain('existing@test.com');
      expect(skippedEmails).toContain('club-exists@test.com');

      expect(
        result.data.skippedEmails.find((s) => s.email === 'existing@test.com'),
      ).toMatchObject({
        email: 'existing@test.com',
        reason: 'A user with this email already exists.',
      });

      expect(
        result.data.skippedEmails.find(
          (s) => s.email === 'club-exists@test.com',
        ),
      ).toMatchObject({
        email: 'club-exists@test.com',
        reason: 'A club with this email already exists.',
      });
    });

    it('should generate refCode and OTP for each invitation', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.club.findMany.mockResolvedValue([]);

      // Mock the transaction
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user123',
              email: 'test@example.com',
            }),
          },
          club: {
            create: jest.fn().mockResolvedValue({
              id: 'club123',
              refCode: 'ABC123',
            }),
          },
        };
        return await callback(tx);
      });

      const result = await service.inviteClubs({
        emails: ['test@example.com'],
      });

      expect(result.data.processedEmails).toHaveLength(1);
      expect(codeGenMock.generateUniqueRefCode).toHaveBeenCalledTimes(1);
      expect(otpUtilsMock.generateAndSaveOtp).toHaveBeenCalledTimes(1);
      expect(otpUtilsMock.generateAndSaveOtp).toHaveBeenCalledWith(
        'test@example.com',
        'CLUB_INVITE',
        undefined,
        'user123',
      );
    });

    it('should handle email service failures gracefully', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.club.findMany.mockResolvedValue([]);

      // Mock successful transaction
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user123',
              email: 'test@example.com',
            }),
          },
          club: {
            create: jest.fn().mockResolvedValue({
              id: 'club123',
              refCode: 'ABC123',
            }),
          },
        };
        return await callback(tx);
      });

      // Mock email service failure
      emailServiceMock.sendClubInviteEmail.mockRejectedValue(
        new Error('Email service down'),
      );

      const result = await service.inviteClubs({
        emails: ['test@example.com'],
      });

      expect(result.data.processedEmails).toHaveLength(0);
      expect(result.data.skippedEmails).toHaveLength(1);
      expect(result.data.skippedEmails[0].reason).toBe(
        'System error while creating club invite',
      );
    });

    it('should handle database errors gracefully for individual emails', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.club.findMany.mockResolvedValue([]);

      // Mock transaction failure
      prismaMock.$transaction.mockRejectedValue(
        new Error('DB Connection lost'),
      );

      const result = await service.inviteClubs({
        emails: ['test@example.com'],
      });

      expect(result.data.processedEmails).toHaveLength(0);
      expect(result.data.skippedEmails).toHaveLength(1);
      expect(result.data.skippedEmails[0].reason).toBe(
        'System error while creating club invite',
      );
    });

    it('should handle mixed success and failure scenarios', async () => {
      // Mock one existing user, one successful invite
      prismaMock.user.findMany.mockResolvedValue([
        { email: 'existing@test.com' },
      ]);
      prismaMock.club.findMany.mockResolvedValue([]);

      // Mock transaction for successful email
      prismaMock.$transaction.mockImplementation(async (callback) => {
        // This will only be called for 'new@test.com'
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user123',
              email: 'new@test.com',
            }),
          },
          club: {
            create: jest.fn().mockResolvedValue({
              id: 'club123',
              refCode: 'ABC123',
            }),
          },
        };
        return await callback(tx);
      });

      const result = await service.inviteClubs({
        emails: ['existing@test.com', 'new@test.com'],
      });

      expect(result.data.processedEmails).toHaveLength(1);
      expect(result.data.processedEmails).toContain('new@test.com');
      expect(result.data.skippedEmails).toHaveLength(1);
      expect(result.data.skippedEmails[0].email).toBe('existing@test.com');
      expect(result.data.skippedEmails[0].reason).toBe(
        'A user with this email already exists.',
      );
    });
  });

  describe('deleteClub', () => {
    const mockClub = {
      id: 'club1',
      userId: 'user1',
    };

    it('should successfully delete club and all related data', async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          clubUpdate: { deleteMany: jest.fn() },
          affiliate: { deleteMany: jest.fn() },
          notification: { deleteMany: jest.fn() },
          player: { updateMany: jest.fn() },
          user: { delete: jest.fn() },
        };
        return callback(mockTx);
      });

      const result = await service.deleteClub('club1');

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Club and all related data deleted successfully',
      );
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.deleteClub('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle transaction failures', async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.$transaction.mockRejectedValue(
        new Error('Transaction failed'),
      );

      await expect(service.deleteClub('club1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should properly update player associations', async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          clubUpdate: { deleteMany: jest.fn() },
          affiliate: { deleteMany: jest.fn() },
          notification: { deleteMany: jest.fn() },
          player: {
            updateMany: jest.fn().mockResolvedValue({ count: 5 }),
          },
          user: { delete: jest.fn() },
        };
        return callback(mockTx);
      });

      await service.deleteClub('club1');

      expect(prismaMock.$transaction).toHaveBeenCalled();
      // Verify that player associations are properly handled
      const txCallback = prismaMock.$transaction.mock.calls[0][0];
      const mockTx = {
        clubUpdate: { deleteMany: jest.fn() },
        affiliate: { deleteMany: jest.fn() },
        notification: { deleteMany: jest.fn() },
        player: { updateMany: jest.fn() },
        user: { delete: jest.fn() },
      };

      await txCallback(mockTx);

      expect(mockTx.player.updateMany).toHaveBeenCalledWith({
        where: { clubId: 'club1' },
        data: { clubId: null },
      });
    });

    it('should handle deletion when club has no related data', async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          clubUpdate: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          affiliate: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          notification: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          player: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          user: { delete: jest.fn() },
        };
        return callback(mockTx);
      });

      const result = await service.deleteClub('club1');

      expect(result.success).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getPublicClubProfile', () => {
    const mockClub = {
      id: 'club1',
      about: 'Test club',
      avatar: 'avatar.jpg',
      banner: 'banner.jpg',
      tagline: 'Test tagline',
      category: 'FOOTBALL',
      address: '123 Main St',
      country: 'USA',
      region: 'East',
      phone: '+1234567890',
      focus: 'Youth development',
      founded: '2020',
      refCode: 'ABC123',
      preferredColor: '#FF0000',
      sponsorshipOpportunities: ['Sponsorship 1'],
      sponsorshipPrograms: ['Program 1'],
      socials: { facebook: 'fb', instagram: 'ig', twitter: 'tw' },
      user: {
        name: 'Test Club',
        email: 'club@test.com',
        userType: 'CLUB',
        status: 'ACTIVE',
      },
    };

    it('should return public club profile', async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);

      const result = await service.getPublicClubProfile('club1');

      expect(result.success).toBe(true);
      expect(result.data.userId).toBe('club1');
      expect(result.data.name).toBe('Test Club');
      expect(result.data.email).toBe('club@test.com');
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.getPublicClubProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createAffiliate', () => {
    const mockClub = {
      id: 'club1',
      refCode: 'ABC123',
      user: { name: 'Test Club' },
    };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
    });

    it('should create affiliates successfully', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.affiliate.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createAffiliate('user1', {
        type: AffiliateType.PLAYER,
        emails: ['player1@test.com', 'player2@test.com'],
      });

      expect(result.success).toBe(true);
      expect(result.data.processedEmails).toHaveLength(2);
      expect(result.data.skippedEmails).toHaveLength(0);
    });

    it('should skip existing users', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { email: 'existing@test.com' },
      ]);
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      const result = await service.createAffiliate('user1', {
        type: AffiliateType.PLAYER,
        emails: ['existing@test.com', 'new@test.com'],
      });

      expect(result.data.skippedEmails).toHaveLength(1);
      expect(result.data.skippedEmails[0].email).toBe('existing@test.com');
    });

    it('should send company invite emails for COMPANY type', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.affiliate.createMany.mockResolvedValue({ count: 1 });

      const result = await service.createAffiliate('user1', {
        type: AffiliateType.COMPANY,
        emails: ['company@test.com'],
      });

      expect(result.success).toBe(true);
      expect(result.data.processedEmails).toContain('company@test.com');
      // Email is sent asynchronously, so we can't directly test it here
    });

    it('should send player/supporter invite emails for PLAYER type', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.affiliate.createMany.mockResolvedValue({ count: 1 });

      const result = await service.createAffiliate('user1', {
        type: AffiliateType.PLAYER,
        emails: ['player@test.com'],
      });

      expect(result.success).toBe(true);
      expect(result.data.processedEmails).toContain('player@test.com');
    });

    it('should skip existing invitations', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.affiliate.findMany.mockResolvedValue([
        { email: 'invited@test.com' },
      ]);

      const result = await service.createAffiliate('user1', {
        type: AffiliateType.PLAYER,
        emails: ['invited@test.com'],
      });

      expect(result.data.skippedEmails).toHaveLength(1);
      expect(result.data.skippedEmails[0].email).toBe('invited@test.com');
      expect(result.data.skippedEmails[0].reason).toContain(
        'invitation has already been sent',
      );
    });

    it('should handle bulk invitations', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.affiliate.createMany.mockResolvedValue({ count: 10 });

      const emails = Array.from({ length: 10 }, (_, i) => `player${i}@test.com`);

      const result = await service.createAffiliate('user1', {
        type: AffiliateType.PLAYER,
        emails,
      });

      expect(result.success).toBe(true);
      expect(result.data.processedEmails).toHaveLength(10);
      expect(prismaMock.affiliate.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: AffiliateType.PLAYER,
            clubId: 'club1',
          }),
        ]),
      });
    });
  });

  describe('saveAffiliate', () => {
    const mockClub = { id: 'club1' };
    const mockAffiliate = { id: 'affiliate1' };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.affiliate.findFirst.mockResolvedValue(mockAffiliate);
    });

    it('should save affiliate when not already saved', async () => {
      prismaMock.savedAffiliate.findUnique.mockResolvedValue(null);
      prismaMock.savedAffiliate.create.mockResolvedValue({});

      const result = await service.saveAffiliate('user1', {
        userId: 'user2',
        role: 'player',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('saved successfully');
      expect(prismaMock.savedAffiliate.create).toHaveBeenCalled();
    });

    it('should remove affiliate when already saved', async () => {
      prismaMock.savedAffiliate.findUnique.mockResolvedValue({ id: 'saved1' });
      prismaMock.savedAffiliate.delete.mockResolvedValue({});

      const result = await service.saveAffiliate('user1', {
        userId: 'user2',
        role: 'player',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('removed successfully');
      expect(prismaMock.savedAffiliate.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not affiliated', async () => {
      prismaMock.affiliate.findFirst.mockResolvedValue(null);

      await expect(
        service.saveAffiliate('user1', { userId: 'user2', role: 'player' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSavedAffiliates', () => {
    const mockClub = { id: 'club1' };
    const mockSavedAffiliates = [
      {
        id: 'saved1',
        role: 'player',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user1',
          name: 'Player 1',
          email: 'player1@test.com',
          userType: UserType.PLAYER,
          status: UserStatus.ACTIVE,
          company: null,
          player: {
            id: 'player1',
            about: 'Test player',
            avatar: 'avatar.jpg',
            address: '123 St',
            phone: '+123',
            industry: 'Tech',
            workCountry: ['USA'],
            traits: ['Leadership'],
            skills: ['Football'],
            shirtNumber: 10,
            birthYear: 1995,
            sportsHistory: 'History',
            isQuestionnaireTaken: true,
          },
        },
      },
    ];

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
    });

    it('should return saved affiliates', async () => {
      prismaMock.savedAffiliate.count.mockResolvedValue(1);
      prismaMock.savedAffiliate.findMany.mockResolvedValue(mockSavedAffiliates);

      const result = await service.getSavedAffiliates('user1', {});

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].userType).toBe('player');
    });

    it('should filter by affiliate types', async () => {
      prismaMock.savedAffiliate.count.mockResolvedValue(0);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([]);

      await service.getSavedAffiliates('user1', {
        affiliateTypes: [AffiliateType.PLAYER],
      });

      expect(prismaMock.savedAffiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: { userType: { in: [AffiliateType.PLAYER] } },
          }),
        }),
      );
    });

    it('should return company affiliates with correct data structure', async () => {
      const mockCompanySavedAffiliate = [
        {
          id: 'saved1',
          role: 'company',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user1',
            name: 'Company 1',
            email: 'company1@test.com',
            userType: UserType.COMPANY,
            status: UserStatus.ACTIVE,
            company: {
              id: 'company1',
              about: 'Test company',
              avatar: 'avatar.jpg',
              secondaryAvatar: 'secondary.jpg',
              banner: 'banner.jpg',
              tagline: 'Test tagline',
              address: '123 St',
              country: 'USA',
              phone: '+123',
              focus: 'Tech',
              industry: 'Tech',
              region: 'North',
              availability: 'Available',
              score: 85,
              preferredClubs: ['club1'],
              isQuestionnaireTaken: true,
            },
            player: null,
          },
        },
      ];

      prismaMock.savedAffiliate.count.mockResolvedValue(1);
      prismaMock.savedAffiliate.findMany.mockResolvedValue(
        mockCompanySavedAffiliate,
      );

      const result = await service.getSavedAffiliates('user1', {});

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].userType).toBe('company');
      expect(result.data.data[0]).toHaveProperty('secondaryAvatar');
      expect(result.data.data[0]).toHaveProperty('preferredClubs');
    });

    it('should handle pagination for saved affiliates', async () => {
      prismaMock.savedAffiliate.count.mockResolvedValue(25);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([]);

      const result = await service.getSavedAffiliates('user1', {
        page: 2,
        limit: 10,
      });

      expect(result.data.meta.page).toBe(2);
      expect(result.data.meta.totalPages).toBe(3);
      expect(prismaMock.savedAffiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('declineAffiliate', () => {
    const mockClub = { id: 'club1' };
    const mockAffiliate = { id: 'affiliate1', email: 'test@example.com' };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
    });

    it('should decline affiliate successfully', async () => {
      prismaMock.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      prismaMock.affiliate.delete.mockResolvedValue({});
      emailServiceMock.declineAffiliateInviteEmail.mockResolvedValue(true);

      const result = await service.declineAffiliate('user1', 'affiliate1');

      expect(result.success).toBe(true);
      expect(prismaMock.affiliate.delete).toHaveBeenCalled();
      expect(emailServiceMock.declineAffiliateInviteEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw NotFoundException when affiliate not found', async () => {
      prismaMock.affiliate.findFirst.mockResolvedValue(null);

      await expect(
        service.declineAffiliate('user1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createClubUpdate', () => {
    const mockClub = {
      id: 'club1',
      user: { name: 'Test Club' },
    };
    const mockAffiliates = [
      { user: { id: 'user1', email: 'user1@test.com' } },
      { user: { id: 'user2', email: 'user2@test.com' } },
    ];

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.affiliate.findMany.mockResolvedValue(mockAffiliates);
    });

    it('should create club update and send notifications', async () => {
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          clubUpdate: {
            create: jest.fn().mockResolvedValue({ id: 'update1' }),
          },
          notification: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(mockTx);
      });

      const result = await service.createClubUpdate('user1', {
        message: 'Test update',
      });

      expect(result.success).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getClubUpdates', () => {
    const mockClub = { id: 'club1' };
    const mockUpdates = [
      {
        id: 'update1',
        clubId: 'club1',
        message: 'Update 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
    });

    it('should return club updates with pagination', async () => {
      prismaMock.clubUpdate.count.mockResolvedValue(1);
      prismaMock.clubUpdate.findMany.mockResolvedValue(mockUpdates);

      const result = await service.getClubUpdates('user1', {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getClubHiredPlayers', () => {
    const mockClub = {
      id: 'club1',
      user: { name: 'Test Club' },
    };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
    });

    it('should return hired players successfully', async () => {
      prismaMock.affiliate.findMany.mockResolvedValue([{ userId: 'company1' }]);
      prismaMock.company.findMany.mockResolvedValue([{ id: 'company1' }]);
      prismaMock.job.findMany.mockResolvedValue([{ id: 'job1' }]);
      prismaMock.shortlisted.findMany.mockResolvedValue([
        {
          player: {
            id: 'player1',
            user: { name: 'Player 1', userType: UserType.PLAYER },
          },
        },
      ]);
      prismaMock.shortlisted.count.mockResolvedValue(1);

      const result = await service.getClubHiredPlayers('club1', 1, 10);

      expect(result.success).toBe(true);
      if (
        'data' in result &&
        typeof result.data === 'object' &&
        'data' in result.data
      ) {
        expect(result.data.data).toHaveLength(1);
      }
    });

    it('should return empty when club has no affiliates', async () => {
      prismaMock.affiliate.findMany.mockResolvedValue([]);

      const result = await service.getClubHiredPlayers('club1', 1, 10);

      expect(result.success).toBe(true);
      expect(
        Array.isArray(result.data) ? result.data : result.data.data,
      ).toEqual([]);
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(
        service.getClubHiredPlayers('nonexistent', 1, 10),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboard', () => {
    const mockClub = { id: 'club1' };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      (prismaMock as any).invoice = {
        aggregate: jest.fn(),
      };
    });

    it('should return dashboard data with metrics', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(25) // players count
        .mockResolvedValueOnce(5); // companies count
      prismaMock.shortlisted.count.mockResolvedValue(10); // hired count
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
      });

      // Mock the calculatePreviousPeriodData method
      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 20,
        companiesCount: 4,
        hiredCount: 8,
      });

      const result = await service.getDashboard('user1');

      expect(result.success).toBe(true);
      expect(result.data.metrics).toHaveLength(3);
      expect(result.data.metrics[0].title).toBe('Total Players');
      expect(result.data.metrics[0].count).toBe(25);
      expect(result.data.metrics[1].title).toBe('Hired Players');
      expect(result.data.metrics[1].count).toBe(10);
      expect(result.data.metrics[2].title).toBe('Total Partners');
      expect(result.data.metrics[2].count).toBe(5);
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.getDashboard('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle "today" period filter', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2);
      prismaMock.shortlisted.count.mockResolvedValue(5);
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 25000 },
      });

      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 8,
        companiesCount: 1,
        hiredCount: 3,
      });

      const result = await service.getDashboard('user1', { period: 'today' });

      expect(result.success).toBe(true);
      expect(result.data.metrics).toHaveLength(3);
    });

    it('should handle "yesterday" period filter', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(1);
      prismaMock.shortlisted.count.mockResolvedValue(2);
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 15000 },
      });

      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 4,
        companiesCount: 1,
        hiredCount: 1,
      });

      const result = await service.getDashboard('user1', { period: 'yesterday' });

      expect(result.success).toBe(true);
      expect(result.data.metrics).toHaveLength(3);
    });

    it('should handle "last_month" period filter', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(8);
      prismaMock.shortlisted.count.mockResolvedValue(20);
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 100000 },
      });

      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 40,
        companiesCount: 6,
        hiredCount: 15,
      });

      const result = await service.getDashboard('user1', { period: 'last_month' });

      expect(result.success).toBe(true);
      expect(result.data.revenue).toBe(100000);
      expect(result.data.paidOut).toBe(40000); // 40% of revenue
    });

    it('should handle "last_year" period filter', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(30);
      prismaMock.shortlisted.count.mockResolvedValue(80);
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 500000 },
      });

      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 150,
        companiesCount: 25,
        hiredCount: 60,
      });

      const result = await service.getDashboard('user1', { period: 'last_year' });

      expect(result.success).toBe(true);
      expect(result.data.metrics[0].percentageChange).toBeGreaterThan(0);
    });

    it('should calculate percentage changes correctly', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(30) // current players
        .mockResolvedValueOnce(6); // current companies
      prismaMock.shortlisted.count.mockResolvedValue(12); // current hired
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 60000 },
      });

      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 20, // previous players
        companiesCount: 4, // previous companies
        hiredCount: 10, // previous hired
      });

      const result = await service.getDashboard('user1', { period: 'last_week' });

      expect(result.success).toBe(true);
      expect(result.data.metrics[0].percentageChange).toBe(50); // (30-20)/20 * 100 = 50%
      expect(result.data.metrics[1].percentageChange).toBe(20); // (12-10)/10 * 100 = 20%
      expect(result.data.metrics[2].percentageChange).toBe(50); // (6-4)/4 * 100 = 50%
    });

    it('should handle percentage change when previous is 0 and current > 0', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(10) // current players (first time)
        .mockResolvedValueOnce(2); // current companies (first time)
      prismaMock.shortlisted.count.mockResolvedValue(5); // current hired (first time)
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 25000 },
      });

      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 0, // previous was 0
        companiesCount: 0, // previous was 0
        hiredCount: 0, // previous was 0
      });

      const result = await service.getDashboard('user1', { period: 'last_week' });

      expect(result.success).toBe(true);
      expect(result.data.metrics[0].percentageChange).toBe(100); // when previous is 0 and current > 0, should return 100
      expect(result.data.metrics[1].percentageChange).toBe(100); // when previous is 0 and current > 0, should return 100
      expect(result.data.metrics[2].percentageChange).toBe(100); // when previous is 0 and current > 0, should return 100
    });

    it('should handle percentage change when previous is 0 and current is 0', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(0) // current players
        .mockResolvedValueOnce(0); // current companies
      prismaMock.shortlisted.count.mockResolvedValue(0); // current hired
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 0 },
      });

      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 0, // previous was 0
        companiesCount: 0, // previous was 0
        hiredCount: 0, // previous was 0
      });

      const result = await service.getDashboard('user1', { period: 'last_week' });

      expect(result.success).toBe(true);
      expect(result.data.metrics[0].percentageChange).toBe(0); // when previous is 0 and current is 0, should return 0
      expect(result.data.metrics[1].percentageChange).toBe(0);
      expect(result.data.metrics[2].percentageChange).toBe(0);
    });

    it('should handle default period case when invalid period provided', async () => {
      prismaMock.affiliate.count
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(3);
      prismaMock.shortlisted.count.mockResolvedValue(7);
      (prismaMock as any).invoice.aggregate.mockResolvedValue({
        _sum: { amount: 35000 },
      });

      jest.spyOn(service as any, 'calculatePreviousPeriodData').mockResolvedValue({
        playersCount: 12,
        companiesCount: 2,
        hiredCount: 5,
      });

      const result = await service.getDashboard('user1', { period: 'invalid_period' as any });

      expect(result.success).toBe(true);
      expect(result.data.metrics).toHaveLength(3);
      // Should use default last_week logic
    });
  });

  describe('getProfile', () => {
    const mockClub = {
      id: 'club1',
      about: 'Test club',
      avatar: 'avatar.jpg',
      banner: 'banner.jpg',
      tagline: 'Test tagline',
      category: 'FOOTBALL',
      address: '123 Main St',
      country: 'USA',
      region: 'East',
      phone: '+1234567890',
      focus: 'Youth development',
      founded: '2020',
      refCode: 'ABC123',
      preferredColor: '#FF0000',
      sponsorshipOpportunities: ['Sponsorship 1'],
      sponsorshipPrograms: ['Program 1'],
      socials: { facebook: 'fb', instagram: 'ig', twitter: 'tw' },
      onboardingSteps: [],
      user: {
        name: 'Test Club',
        email: 'club@test.com',
        userType: UserType.CLUB,
        status: UserStatus.ACTIVE,
      },
    };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.affiliate.findFirst.mockResolvedValue({
        isApproved: true,
      });
    });

    it('should return club profile', async () => {
      const result = await service.getProfile('user1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('club1');
      expect(result.data.name).toBe('Test Club');
      expect(result.data.email).toBe('club@test.com');
      expect(result.data.isApproved).toBe(true);
    });

    it('should return isApproved true by default', async () => {
      const result = await service.getProfile('user1');

      expect(result.data.isApproved).toBe(true);
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAffiliates', () => {
    const mockClub = { id: 'club1' };
    const mockAffiliates = [
      {
        id: 'affiliate1',
        clubId: 'club1',
        email: 'test@example.com',
        purpose: 'Testing',
        status: 'PENDING',
        isApproved: false,
        refCode: 'REF123',
        byAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: AffiliateType.PLAYER,
        user: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          userType: UserType.PLAYER,
          company: null,
          player: {
            id: 'player1',
            about: 'Test player',
            avatar: 'avatar.jpg',
            address: '123 St',
            phone: '+123',
            industry: 'Tech',
            shirtNumber: 10,
            birthYear: 1995,
            sportsHistory: 'History',
            isQuestionnaireTaken: true,
          },
        },
      },
    ];

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
    });

    it('should return affiliates with saved status', async () => {
      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue(mockAffiliates);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([
        { userId: 'user1' },
      ]);

      const result = await service.getAffiliates('user1', {});

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].isSaved).toBe(true);
    });

    it('should filter by affiliate types', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([]);

      await service.getAffiliates('user1', {
        affiliateTypes: [AffiliateType.PLAYER],
      });

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: [AffiliateType.PLAYER] },
          }),
        }),
      );
    });

    it('should filter by search term', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([]);

      await service.getAffiliates('user1', { search: 'test' });

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                email: expect.objectContaining({ contains: 'test' }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.getAffiliates('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should filter by single status', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([]);

      await service.getAffiliates('user1', {
        status: ['PENDING'] as any
      });

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['PENDING'] },
          }),
        }),
      );
    });

    it('should filter by multiple statuses', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([]);

      await service.getAffiliates('user1', {
        status: ['PENDING', 'ACTIVE'] as any
      });

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['PENDING', 'ACTIVE'] },
          }),
        }),
      );
    });

    it('should combine status and affiliate type filters', async () => {
      prismaMock.affiliate.count.mockResolvedValue(0);
      prismaMock.affiliate.findMany.mockResolvedValue([]);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([]);

      await service.getAffiliates('user1', {
        status: ['ACTIVE'] as any,
        affiliateTypes: [AffiliateType.PLAYER],
      });

      expect(prismaMock.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['ACTIVE'] },
            type: { in: [AffiliateType.PLAYER] },
          }),
        }),
      );
    });

    it('should handle affiliates without user profiles', async () => {
      const affiliatesWithoutUser = [
        {
          id: 'affiliate1',
          clubId: 'club1',
          email: 'pending@test.com',
          purpose: 'Testing',
          status: 'PENDING',
          isApproved: false,
          refCode: 'REF123',
          byAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          type: AffiliateType.PLAYER,
          user: null, // No user yet
        },
      ];

      prismaMock.affiliate.count.mockResolvedValue(1);
      prismaMock.affiliate.findMany.mockResolvedValue(affiliatesWithoutUser);
      prismaMock.savedAffiliate.findMany.mockResolvedValue([]);

      const result = await service.getAffiliates('user1', {});

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].userData.name).toBe('');
      expect(result.data.data[0].isSaved).toBe(false);
    });
  });

  describe('completeProfile', () => {
    const mockClub = {
      id: 'club1',
      onboardingSteps: [1, 2],
    };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.club.update.mockResolvedValue({
        ...mockClub,
        onboardingSteps: [2],
      });
    });

    it('should complete profile step 1 successfully', async () => {
      const result = await service.completeProfile(
        'user1',
        {
          step: 1,
          category: 'FOOTBALL',
          about: 'Test club',
          phone: '+123456789',
        },
        undefined,
      );

      expect(result.success).toBe(true);
      expect(result.data.completedStep).toBe(1);
      expect(prismaMock.club.update).toHaveBeenCalled();
    });

    it('should complete profile step 2 with file uploads', async () => {
      const files = {
        avatar: { originalname: 'avatar.jpg' } as any,
        banner: { originalname: 'banner.jpg' } as any,
      };

      const result = await service.completeProfile(
        'user1',
        {
          step: 2,
          focus: 'Youth development',
          website: 'https://club.com',
        },
        files,
      );

      expect(result.success).toBe(true);
      expect(minioServiceMock.uploadFile).toHaveBeenCalledTimes(2);
    });

    it('should handle step completion and track remaining steps', async () => {
      prismaMock.club.findUnique.mockResolvedValue({
        id: 'club1',
        onboardingSteps: [1, 2],
      });

      prismaMock.club.update.mockResolvedValue({
        id: 'club1',
        onboardingSteps: [2], // Step 1 removed
      });

      const result = await service.completeProfile(
        'user1',
        {
          step: 1,
          category: 'FOOTBALL',
          about: 'Test club',
        },
        undefined,
      );

      expect(result.success).toBe(true);
      expect(result.data.completedStep).toBe(1);
      expect(result.data.nextStep).toBe(2);
      expect(result.data.isOnboardingComplete).toBe(false);

      // Verify the club update was called
      expect(prismaMock.club.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' },
          data: expect.objectContaining({
            onboardingSteps: [2], // Step 1 should be removed
          }),
        }),
      );
    });

    it('should throw BadRequestException when step already completed', async () => {
      prismaMock.club.findUnique.mockResolvedValue({
        id: 'club1',
        onboardingSteps: [2], // Step 1 already done
      });

      await expect(
        service.completeProfile('user1', { step: 1 }, undefined),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(
        service.completeProfile('user1', { step: 1 }, undefined),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const mockClub = { id: 'club1' };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.club.update.mockResolvedValue(mockClub);
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(prismaMock),
      );
    });

    it('should update profile successfully', async () => {
      const result = await service.updateProfile(
        'user1',
        {
          name: 'Updated Club',
          about: 'Updated description',
          phone: '+987654321',
        },
        undefined,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Club profile updated successfully');
    });

    it('should update profile with file uploads', async () => {
      const files = {
        avatar: { originalname: 'avatar.jpg' } as any,
        banner: { originalname: 'banner.jpg' } as any,
      };

      const result = await service.updateProfile(
        'user1',
        { about: 'Test' },
        files,
      );

      expect(result.success).toBe(true);
      expect(minioServiceMock.uploadFile).toHaveBeenCalledTimes(2);
    });

    it('should return no changes when no updates provided', async () => {
      const result = await service.updateProfile('user1', {}, undefined);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No changes detected');
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('user1', { about: 'Test' }, undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle file upload errors gracefully', async () => {
      minioServiceMock.uploadFile.mockRejectedValueOnce(
        new Error('Upload failed'),
      );

      const files = {
        avatar: { originalname: 'avatar.jpg' } as any,
      };

      const result = await service.updateProfile(
        'user1',
        { about: 'Test' },
        files,
      );

      // Should still succeed but without the avatar
      expect(result.success).toBe(true);
    });

    it('should update only changed fields', async () => {
      const result = await service.updateProfile(
        'user1',
        {
          about: 'New about text',
          phone: '+1234567890',
        },
        undefined,
      );

      expect(result.success).toBe(true);
      expect(prismaMock.club.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' },
          data: expect.objectContaining({
            about: 'New about text',
            phone: '+1234567890',
          }),
        }),
      );
    });

    it('should handle address updates with partial data', async () => {
      const result = await service.updateProfile(
        'user1',
        {
          address: {
            street: '123 Main St',
            city: 'New York',
            postalCode: '10001',
          },
        },
        undefined,
      );

      expect(result.success).toBe(true);
      expect(prismaMock.club.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            address: {
              street: '123 Main St',
              city: 'New York',
              postalCode: '10001',
            },
          }),
        }),
      );
    });

    it('should throw BadRequestException for empty address', async () => {
      await expect(
        service.updateProfile(
          'user1',
          {
            address: {} as any,
          },
          undefined,
        ),
      ).rejects.toThrow();
    });
  });

  describe('getRevenueDashboard', () => {
    const mockClub = { id: 'club1' };
    const mockInvoices = [
      {
        id: 'inv1',
        invoiceCode: 'INV001',
        amount: 10000,
        status: 'PAID',
        createdAt: new Date('2025-01-15'),
        company: {
          user: { name: 'Company 1' },
        },
      },
      {
        id: 'inv2',
        invoiceCode: 'INV002',
        amount: 5000,
        status: 'PENDING',
        createdAt: new Date('2025-01-16'),
        company: {
          user: { name: 'Company 2' },
        },
      },
    ];

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      (prismaMock as any).invoice = {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      };
    });

    it('should return revenue dashboard metrics', async () => {
      (prismaMock as any).invoice.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }) // total revenue
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }) // paid out calculation
        .mockResolvedValueOnce({ _sum: { amount: 20000 } }); // pending revenue

      (prismaMock as any).invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getRevenueDashboard('user1');

      expect(result.metrics.totalAccumulatedRevenue).toBe(100000);
      expect(result.metrics.currentBalance).toBe(60000); // 100000 - 40000 (40% paidOut)
      expect(result.metrics.pendingRevenue).toBe(20000);
      expect(result.recentTransactions).toHaveLength(2);
      expect(result.recentTransactions[0].company).toBe('Company 1');
    });

    it('should handle zero revenue', async () => {
      (prismaMock as any).invoice.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });

      (prismaMock as any).invoice.findMany.mockResolvedValue([]);

      const result = await service.getRevenueDashboard('user1');

      expect(result.metrics.totalAccumulatedRevenue).toBe(0);
      expect(result.metrics.currentBalance).toBe(0);
      expect(result.recentTransactions).toHaveLength(0);
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.getRevenueDashboard('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRevenueTransactions', () => {
    const mockClub = { id: 'club1' };
    const mockTransactions = [
      {
        id: 'inv1',
        invoiceCode: 'INV001',
        amount: 10000,
        status: 'PAID',
        createdAt: new Date('2025-01-15'),
        company: {
          user: { name: 'Company 1' },
        },
      },
    ];

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      (prismaMock as any).invoice = {
        findMany: jest.fn(),
        count: jest.fn(),
      };
    });

    it('should return revenue transactions with pagination', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue(mockTransactions);
      (prismaMock as any).invoice.count.mockResolvedValue(25);

      const result = await service.getRevenueTransactions('user1', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(25);
      expect(result.data[0].company).toBe('Company 1');
    });

    it('should apply status filter', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue([]);
      (prismaMock as any).invoice.count.mockResolvedValue(0);

      await service.getRevenueTransactions('user1', { status: 'PAID' });

      const whereUsed = (prismaMock as any).invoice.findMany.mock.calls[0][0].where;
      expect(whereUsed.status).toBe('PAID');
    });

    it('should apply search filter', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue([]);
      (prismaMock as any).invoice.count.mockResolvedValue(0);

      await service.getRevenueTransactions('user1', { search: 'INV' });

      const whereUsed = (prismaMock as any).invoice.findMany.mock.calls[0][0].where;
      expect(whereUsed.OR).toBeDefined();
    });

    it('should apply date range filters', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue([]);
      (prismaMock as any).invoice.count.mockResolvedValue(0);

      await service.getRevenueTransactions('user1', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      const whereUsed = (prismaMock as any).invoice.findMany.mock.calls[0][0].where;
      expect(whereUsed.createdAt).toBeDefined();
      expect(whereUsed.createdAt.gte).toBeDefined();
      expect(whereUsed.createdAt.lte).toBeDefined();
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(
        service.getRevenueTransactions('nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestWithdrawal', () => {
    const mockClub = { id: 'club1' };
    const mockInvoice = {
      id: 'inv1',
      invoiceCode: 'INV001',
      amount: 10000,
      status: 'PAID',
    };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      (prismaMock as any).invoice = {
        findFirst: jest.fn(),
      };
    });

    it('should successfully request withdrawal', async () => {
      (prismaMock as any).invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.requestWithdrawal('user1', {
        invoiceId: 'INV001',
        amount: 5000,
        notes: 'Test withdrawal',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Pending approval');
      expect(result.data.amount).toBe(5000);
      expect(result.data.status).toBe('pending');
    });

    it('should throw BadRequestException when invoice not found', async () => {
      (prismaMock as any).invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.requestWithdrawal('user1', {
          invoiceId: 'INV999',
          amount: 5000,
        }),
      ).rejects.toThrow();
    });

    it('should throw BadRequestException when amount exceeds invoice', async () => {
      (prismaMock as any).invoice.findFirst.mockResolvedValue(mockInvoice);

      await expect(
        service.requestWithdrawal('user1', {
          invoiceId: 'INV001',
          amount: 20000, // More than invoice amount
        }),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(
        service.requestWithdrawal('nonexistent', {
          invoiceId: 'INV001',
          amount: 5000,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRevenueChart', () => {
    const mockClub = { id: 'club1' };

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      (prismaMock as any).invoice = {
        groupBy: jest.fn(),
      };
    });

    it('should return revenue chart data for this month', async () => {
      const mockMonthlyData = [
        {
          createdAt: new Date('2025-01-15'),
          _sum: { amount: 10000 },
        },
      ];

      (prismaMock as any).invoice.groupBy.mockResolvedValue(mockMonthlyData);

      const result = await service.getRevenueChart('user1', {
        period: 'this-month',
      });

      expect(result.chartData).toBeDefined();
      expect(result.summary.inflow).toBe(10000);
      expect(result.summary.outflow).toBe(4000); // 40% of inflow
      expect(result.period.start).toBeDefined();
      expect(result.period.end).toBeDefined();
    });

    it('should return revenue chart data for last month', async () => {
      (prismaMock as any).invoice.groupBy.mockResolvedValue([]);

      const result = await service.getRevenueChart('user1', {
        period: 'last-month',
      });

      expect(result.chartData).toBeDefined();
      expect(result.summary.inflow).toBe(0);
    });

    it('should return revenue chart data for custom period', async () => {
      (prismaMock as any).invoice.groupBy.mockResolvedValue([]);

      const result = await service.getRevenueChart('user1', {
        period: 'custom',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(result.chartData).toBeDefined();
      expect(result.period.start).toBeDefined();
      expect(result.period.end).toBeDefined();
    });

    it('should throw BadRequestException for custom period without dates', async () => {
      await expect(
        service.getRevenueChart('user1', { period: 'custom' }),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(
        service.getRevenueChart('nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHireHistory (club service)', () => {
    const mockClub = { id: 'club1' };
    const mockInvoices = [
      {
        id: 'inv1',
        invoiceCode: 'INV001',
        amount: 10000,
        status: 'PAID',
        createdAt: new Date('2025-01-15'),
        company: {
          user: { name: 'Company 1' },
        },
      },
    ];

    beforeEach(() => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      (prismaMock as any).invoice = {
        findMany: jest.fn(),
        count: jest.fn(),
      };
    });

    it('should return hire history with pagination', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue(mockInvoices);
      (prismaMock as any).invoice.count.mockResolvedValue(20);

      const result = await service.getHireHistory('user1', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(20);
      expect(result.data[0].companyName).toBe('Company 1');
      expect(result.data[0].amount).toBe(10000);
    });

    it('should apply status filter', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue([]);
      (prismaMock as any).invoice.count.mockResolvedValue(0);

      await service.getHireHistory('user1', { status: 'PAID' });

      const whereUsed = (prismaMock as any).invoice.findMany.mock.calls[0][0].where;
      expect(whereUsed.status).toBe('PAID');
    });

    it('should apply companyId filter', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue([]);
      (prismaMock as any).invoice.count.mockResolvedValue(0);

      await service.getHireHistory('user1', { companyId: 'comp1' });

      const whereUsed = (prismaMock as any).invoice.findMany.mock.calls[0][0].where;
      expect(whereUsed.companyId).toBe('comp1');
    });

    it('should apply search filter', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue([]);
      (prismaMock as any).invoice.count.mockResolvedValue(0);

      await service.getHireHistory('user1', { search: 'INV' });

      const whereUsed = (prismaMock as any).invoice.findMany.mock.calls[0][0].where;
      expect(whereUsed.OR).toBeDefined();
    });

    it('should apply date range filters', async () => {
      (prismaMock as any).invoice.findMany.mockResolvedValue([]);
      (prismaMock as any).invoice.count.mockResolvedValue(0);

      await service.getHireHistory('user1', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      const whereUsed = (prismaMock as any).invoice.findMany.mock.calls[0][0].where;
      expect(whereUsed.createdAt).toBeDefined();
    });

    it('should throw NotFoundException when club not found', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.getHireHistory('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
