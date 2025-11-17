import { Test, TestingModule } from '@nestjs/testing';
import { PlayerSupporterService } from './player-supporter.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AffiliateType, JobStatus, EmploymentType } from '@prisma/client';
import { MinioService } from 'src/utils/minio.utils';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmploymentTypeJson } from 'src/types/json-models/employment.type';
import { JobRoleJson } from 'src/types/json-models/job-role.type';

const prismaMock = {
  player: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  experience: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  affiliate: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  job: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  company: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  application: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  playerBookmark: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  chat: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
  $runCommandRaw: jest.fn(),
};

const minioMock = {
  uploadFile: jest.fn(),
};

describe('PlayerSupporterService', () => {
  let service: PlayerSupporterService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerSupporterService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MinioService, useValue: minioMock },
      ],
    }).compile();

    service = module.get<PlayerSupporterService>(PlayerSupporterService);

    jest.spyOn(service['logger'], 'error').mockImplementation(jest.fn());
  });

  describe('Public APIs', () => {
    describe('getPublicPlayers', () => {
      it('returns players with pagination and name-only search', async () => {
        const players = [
          {
            id: 'p1',
            about: 'About 1',
            address: 'Addr 1',
            country: 'US',
            workCountry: ['US'],
            traits: ['teamwork'],
            skills: ['react'],
            avatar: 'a1.png',
            user: { name: 'Alice', email: 'alice@test.com' },
          },
          {
            id: 'p2',
            about: 'About 2',
            address: 'Addr 2',
            country: 'UK',
            workCountry: ['UK'],
            traits: ['leadership'],
            skills: ['node'],
            avatar: 'a2.png',
            user: { name: 'Bob', email: 'bob@test.com' },
          },
        ];

        prismaMock.player.findMany.mockResolvedValue(players);
        prismaMock.player.count.mockResolvedValue(2);

        const res = await service.getPublicPlayers({
          page: 1,
          limit: 10,
          search: 'al',
        } as any);

        expect(prismaMock.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              user: expect.objectContaining({ is: expect.any(Object) }),
            }),
            orderBy: { createdAt: 'desc' },
            skip: 0,
            take: 10,
          }),
        );
        expect(res.success).toBe(true);
        expect(res.message).toBe('Players fetched successfully');
        expect(res.data.data).toHaveLength(2);
        expect(res.data.meta).toEqual({
          total: 2,
          totalPages: 1,
          page: 1,
          limit: 10,
        });
      });

      it('handles empty results', async () => {
        prismaMock.player.findMany.mockResolvedValue([]);
        prismaMock.player.count.mockResolvedValue(0);

        const res = await service.getPublicPlayers({
          page: 1,
          limit: 5,
        } as any);

        expect(res.data.data).toEqual([]);
        expect(res.data.meta).toEqual({
          total: 0,
          totalPages: 0,
          page: 1,
          limit: 5,
        });
      });

      it('throws InternalServerErrorException on db error', async () => {
        prismaMock.player.findMany.mockRejectedValue(new Error('DB error'));

        await expect(
          service.getPublicPlayers({ page: 1, limit: 10 } as any),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });

    describe('getPublicPlayersList', () => {
      it('returns player list (names) with pagination', async () => {
        prismaMock.player.findMany.mockResolvedValue([
          { id: 'p1', user: { name: 'Alice' } },
          { id: 'p2', user: { name: 'Bob' } },
        ]);
        prismaMock.player.count.mockResolvedValue(2);

        const res = await service.getPublicPlayersList({ page: 1, limit: 10 });

        expect(res.success).toBe(true);
        expect(res.message).toBe('Players list fetched successfully');
        expect(res.data).toEqual([
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
        ]);
        expect(res.meta).toEqual({
          total: 2,
          totalPages: 1,
          page: 1,
          limit: 10,
        });
      });

      it('throws InternalServerErrorException on db error', async () => {
        prismaMock.player.findMany.mockRejectedValue(new Error('DB down'));

        await expect(
          service.getPublicPlayersList({ page: 1, limit: 10 }),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });

    describe('getPublicProfile', () => {
      const mockAffiliate = {
        userId: 'u1',
        club: {
          id: 'c1',
          avatar: 'c.png',
          banner: 'b.png',
          preferredColor: '#fff',
        },
      };

      const mockPlayer = {
        id: 'p1',
        about: 'About',
        address: 'Addr',
        workAvailability: true,
        workCountry: ['US'],
        employmentType: { primary: 'FULL_TIME' },
        traits: ['teamwork'],
        skills: ['react'],
        resume: 'resume.pdf',
        phone: '123',
        experiences: [],
        shirtNumber: 7,
        birthYear: 1995,
        sportsHistory: 'history',
        avatar: 'avatar.png',
        yearsOfExperience: 5,
        certifications: ['cert'],
        score: 80,
        industry: 'TECH',
        jobRole: { primary: 'ENGINEER' },
        user: {
          id: 'u1',
          email: 'a@b.com',
          name: 'Alice',
          userType: 'PLAYER',
          status: 'ACTIVE',
          affiliates: [
            {
              club: {
                id: 'c1',
                avatar: 'c.png',
                banner: 'b.png',
                preferredColor: '#fff',
              },
            },
          ],
        },
      };

      beforeEach(() => {
        prismaMock.player.findUnique.mockResolvedValue(mockPlayer as any);
        prismaMock.company.findUnique.mockResolvedValue(null);
        prismaMock.chat.findFirst.mockResolvedValue(null);
      });

      it('returns public profile with club fields when available', async () => {
        const res = await service.getPublicProfile('p1');

        expect(res.success).toBe(true);
        expect(res.message).toBe('Profile fetched successfully');
        expect(res.data.userId).toBe('u1');
        expect(res.data.club).toEqual({
          id: 'c1',
          avatar: 'c.png',
          banner: 'b.png',
          preferredColor: '#fff',
        });
        expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
          where: { id: 'p1' },
          select: expect.any(Object),
        });
      });

      it('tracks player view when company views profile', async () => {
        const companyProfileId = 'company-1';
        prismaMock.company.findUnique.mockResolvedValue({ userId: 'company-user-id' } as any);
        prismaMock.$runCommandRaw.mockResolvedValue({ ok: 1 } as any);
        prismaMock.chat.findFirst.mockResolvedValue(null);

        await service.getPublicProfile('p1', companyProfileId, 'COMPANY');

        // Give async operation time to complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
          where: { id: companyProfileId },
          select: { userId: true },
        });
        expect(prismaMock.$runCommandRaw).toHaveBeenCalledWith({
          update: 'companies',
          updates: [
            {
              q: { _id: { $oid: companyProfileId } },
              u: [
                {
                  $set: {
                    recentlyViewedPlayers: {
                      $slice: [
                        {
                          $concatArrays: [
                            ['p1'],
                            {
                              $filter: {
                                input: {
                                  $ifNull: ['$recentlyViewedPlayers', []],
                                },
                                cond: { $ne: ['$$this', 'p1'] },
                              },
                            },
                          ],
                        },
                        4,
                      ],
                    },
                  },
                },
              ],
            },
          ],
        });
      });

      it('does not track view when no user is provided', async () => {
        await service.getPublicProfile('p1');

        expect(prismaMock.company.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.$runCommandRaw).not.toHaveBeenCalled();
      });

      it('does not track view when user is not a company', async () => {
        await service.getPublicProfile('p1', 'player-1', 'PLAYER');

        expect(prismaMock.company.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.$runCommandRaw).not.toHaveBeenCalled();
      });

      it('continues successfully if tracking fails', async () => {
        const companyProfileId = 'company-1';
        prismaMock.company.findUnique.mockRejectedValueOnce(new Error('DB error'));
        prismaMock.company.findUnique.mockResolvedValueOnce(null);
        prismaMock.chat.findFirst.mockResolvedValue(null);

        const res = await service.getPublicProfile('p1', companyProfileId, 'COMPANY');

        // Give async operation time to complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(res.success).toBe(true);
        expect(res.message).toBe('Profile fetched successfully');
      });

      it('throws NotFoundException when player not found', async () => {
        prismaMock.player.findUnique.mockResolvedValue(null);

        await expect(service.getPublicProfile('p1')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('throws InternalServerErrorException on db error', async () => {
        prismaMock.player.findUnique.mockRejectedValue(new Error('DB error'));

        await expect(service.getPublicProfile('p1')).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('deletePlayer', () => {
    const playerId = 'player-1';

    it('deletes player and related data successfully', async () => {
      prismaMock.player.findUnique.mockResolvedValue({
        id: playerId,
        userId: 'user-1',
      });

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          application: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          shortlisted: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          notification: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          refreshToken: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          affiliate: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          otpCode: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          user: { delete: jest.fn().mockResolvedValue({}) },
        } as any;
        return callback(txMock);
      });

      const res = await service.deletePlayer(playerId);

      expect(res.success).toBe(true);
      expect(res.message).toBe(
        'Player and all related data deleted successfully',
      );
      expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
        where: { id: playerId },
        select: { id: true, userId: true },
      });
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('throws NotFoundException when player is not found', async () => {
      prismaMock.player.findUnique.mockResolvedValue(null);

      await expect(service.deletePlayer('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException when transaction fails', async () => {
      prismaMock.player.findUnique.mockResolvedValue({
        id: playerId,
        userId: 'user-1',
      });
      prismaMock.$transaction.mockRejectedValue(new Error('DB error'));

      await expect(service.deletePlayer(playerId)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('calls expected deletion operations inside transaction', async () => {
      prismaMock.player.findUnique.mockResolvedValue({
        id: playerId,
        userId: 'user-1',
      });

      let capturedTx: any;
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        capturedTx = {
          application: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          shortlisted: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          notification: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          refreshToken: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          affiliate: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          otpCode: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          user: { delete: jest.fn().mockResolvedValue({}) },
        } as any;
        return callback(capturedTx);
      });

      await service.deletePlayer(playerId);

      expect(capturedTx.application.deleteMany).toHaveBeenCalledWith({
        where: { playerId },
      });
      expect(capturedTx.shortlisted.deleteMany).toHaveBeenCalledWith({
        where: { playerId },
      });
      expect(capturedTx.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(capturedTx.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(capturedTx.affiliate.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(capturedTx.otpCode.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(capturedTx.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('getProfile', () => {
    const mockPlayerData = {
      id: 'player-1',
      about: 'Software developer with 5 years experience',
      address: '123 Main St, City',
      avatar: 'avatar-url.jpg',
      shirtNumber: 10,
      birthYear: 1990,
      sportsHistory: 'Football, Basketball',
      industry: 'Technology',
      phone: '+1234567890',
      workAvailability: true,
      yearsOfExperience: 5,
      score: 85,
      isQuestionnaireTaken: true,
      analysisResult: {
        strength: 'Leadership',
        weakness: 'Time management',
      },
      resume: 'resume-url.pdf',
      workCountry: ['USA', 'Canada'],
      jobRole: {
        primary: 'SOFTWARE_ENGINEER',
        secondary: ['FRONTEND_DEVELOPER', 'BACKEND_DEVELOPER'],
      } as JobRoleJson,
      employmentType: {
        primary: 'FULL_TIME',
        secondary: ['CONTRACT'],
      } as EmploymentTypeJson,
      certifications: ['AWS', 'React'],
      traits: ['Leadership', 'Communication'],
      skills: ['JavaScript', 'TypeScript', 'React'],
      onboardingSteps: [1, 2, 3],
      experiences: [
        {
          id: 'exp-1',
          title: 'Senior Developer',
          company: 'Tech Corp',
          current: true,
          remote: true,
          startDate: new Date('2022-01-01'),
          endDate: null,
          skills: ['React', 'Node.js'],
          tools: ['VS Code', 'Git'],
          responsibilities: ['Lead development', 'Code review'],
        },
      ],
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        userType: 'PLAYER',
        status: 'ACTIVE',
      },
    };

    const mockAffiliateData = {
      isApproved: true,
      club: {
        id: 'club-1',
        avatar: 'club-avatar.jpg',
        banner: 'club-banner.jpg',
        preferredColor: '#FF0000',
        user: {
          name: 'Tech United FC',
        },
      },
    };

    describe('successful profile retrieval', () => {
      it('should return complete profile data when player exists with affiliate', async () => {
        prismaMock.player.findUnique.mockResolvedValue(mockPlayerData);
        prismaMock.affiliate.findFirst.mockResolvedValue(mockAffiliateData);

        const result = await service.getProfile('user-1');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Profile fetched successfully');
        expect(result.data).toMatchObject({
          id: 'player-1',
          name: 'John Doe',
          email: 'john@example.com',
          userType: 'player',
          about: 'Software developer with 5 years experience',
          address: '123 Main St, City',
          workLocations: ['USA', 'Canada'],
          traits: ['Leadership', 'Communication'],
          skills: ['JavaScript', 'TypeScript', 'React'],
          resume: 'resume-url.pdf',
          phone: '+1234567890',
          workAvailability: true,
          shirtNumber: 10,
          birthYear: 1990,
          sportsHistory: 'Football, Basketball',
          avatar: 'avatar-url.jpg',
          status: 'active',
          onboardingSteps: [1, 2, 3],
          yearsOfExperience: 5,
          certifications: ['AWS', 'React'],
          score: 85,
          isQuestionnaireTaken: true,
          industry: 'Technology',
          isApproved: true,
          analysisResult: {
            strength: 'Leadership',
            weakness: 'Time management',
          },
          employmentType: {
            primary: 'full-time',
            secondary: ['contract'],
          },
          jobRole: {
            primary: 'software_engineer',
            secondary: ['frontend_developer', 'backend_developer'],
          },
          club: {
            id: 'club-1',
            name: 'Tech United FC',
            avatar: 'club-avatar.jpg',
            banner: 'club-banner.jpg',
            preferredColor: '#FF0000',
          },
        });

        expect(result.data.experiences).toHaveLength(1);
        expect(result.data.experiences[0]).toMatchObject({
          id: 'exp-1',
          title: 'Senior Developer',
          company: 'Tech Corp',
          current: true,
          remote: true,
          skills: ['React', 'Node.js'],
          tools: ['VS Code', 'Git'],
          responsibilities: ['Lead development', 'Code review'],
        });
      });

      it('should return profile data without affiliate when no affiliate exists', async () => {
        prismaMock.player.findUnique.mockResolvedValue(mockPlayerData);
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.success).toBe(true);
        expect(result.data.club).toEqual({
          _id: undefined,
          name: undefined,
          avatar: undefined,
          banner: undefined,
          preferredColor: undefined,
        });
        expect(result.data.isApproved).toBeUndefined();
      });

      it('should handle player without questionnaire taken', async () => {
        const playerWithoutQuestionnaire = {
          ...mockPlayerData,
          isQuestionnaireTaken: false,
          score: null,
          analysisResult: null,
        };

        prismaMock.player.findUnique.mockResolvedValue(
          playerWithoutQuestionnaire,
        );
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.success).toBe(true);
        expect(result.data.isQuestionnaireTaken).toBe(false);
        expect(result.data.score).toBeNull();
        expect(result.data.analysisResult).toBeUndefined();
      });

      it('should handle player without employment type', async () => {
        const playerWithoutEmploymentType = {
          ...mockPlayerData,
          employmentType: null,
        };

        prismaMock.player.findUnique.mockResolvedValue(
          playerWithoutEmploymentType,
        );
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.success).toBe(true);
        expect(result.data.employmentType).toBeUndefined();
      });

      it('should handle player without job role', async () => {
        const playerWithoutJobRole = {
          ...mockPlayerData,
          jobRole: null,
        };

        prismaMock.player.findUnique.mockResolvedValue(playerWithoutJobRole);
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.success).toBe(true);
        expect(result.data.jobRole).toBeUndefined();
      });

      it('should handle employment type without secondary values', async () => {
        const playerWithPrimaryEmploymentOnly = {
          ...mockPlayerData,
          employmentType: {
            primary: 'PART_TIME',
          } as EmploymentTypeJson,
        };

        prismaMock.player.findUnique.mockResolvedValue(
          playerWithPrimaryEmploymentOnly,
        );
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.data.employmentType).toEqual({
          primary: 'part-time',
          secondary: undefined,
        });
      });

      it('should handle job role without secondary values', async () => {
        const playerWithPrimaryJobRoleOnly = {
          ...mockPlayerData,
          jobRole: {
            primary: 'DATA_SCIENTIST',
          } as JobRoleJson,
        };

        prismaMock.player.findUnique.mockResolvedValue(
          playerWithPrimaryJobRoleOnly,
        );
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.data.jobRole).toEqual({
          primary: 'data_scientist',
          secondary: undefined,
        });
      });
    });

    describe('error handling', () => {
      it('should throw NotFoundException when profile is not found', async () => {
        prismaMock.player.findUnique.mockResolvedValue(null);

        await expect(service.getProfile('user-1')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw InternalServerErrorException when database query fails', async () => {
        const dbError = new Error('Database connection failed');
        prismaMock.player.findUnique.mockRejectedValue(dbError);

        await expect(service.getProfile('user-1')).rejects.toThrow(
          InternalServerErrorException,
        );
        await expect(service.getProfile('user-1')).rejects.toThrow(
          'Failed to retrieve profile. Please try again later.',
        );

        expect(service['logger'].error).toHaveBeenCalledWith(
          'Failed to retrieve player profile:',
          dbError,
        );
      });

      it('should throw InternalServerErrorException when affiliate query fails', async () => {
        prismaMock.player.findUnique.mockResolvedValue(mockPlayerData);
        prismaMock.affiliate.findFirst.mockRejectedValue(
          new Error('Affiliate query failed'),
        );

        await expect(service.getProfile('user-1')).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });

    describe('database queries', () => {
      it('should call prisma methods with correct parameters', async () => {
        prismaMock.player.findUnique.mockResolvedValue(mockPlayerData);
        prismaMock.affiliate.findFirst.mockResolvedValue(mockAffiliateData);

        await service.getProfile('user-123');

        expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
          where: { userId: 'user-123' },
          select: {
            id: true,
            about: true,
            address: true,
            avatar: true,
            shirtNumber: true,
            birthYear: true,
            sportsHistory: true,
            industry: true,
            phone: true,
            workAvailability: true,
            yearsOfExperience: true,
            score: true,
            isQuestionnaireTaken: true,
            analysisResult: true,
            resume: true,
            workCountry: true,
            jobRole: true,
            employmentType: true,
            certifications: true,
            traits: true,
            skills: true,
            onboardingSteps: true,
            experiences: {
              select: {
                id: true,
                title: true,
                company: true,
                current: true,
                remote: true,
                startDate: true,
                endDate: true,
                skills: true,
                tools: true,
                responsibilities: true,
              },
              orderBy: { createdAt: 'desc' },
            },
            user: {
              select: {
                name: true,
                email: true,
                userType: true,
                status: true,
              },
            },
          },
        });

        expect(prismaMock.affiliate.findFirst).toHaveBeenCalledWith({
          where: {
            userId: 'user-123',
            type: { in: [AffiliateType.PLAYER, AffiliateType.SUPPORTER] },
          },
          select: {
            isApproved: true,
            club: {
              select: {
                id: true,
                avatar: true,
                banner: true,
                preferredColor: true,
                user: {
                  select: { name: true },
                },
              },
            },
          },
        });
      });
    });

    describe('data transformation', () => {
      it('should correctly transform userType to lowercase', async () => {
        const playerWithUppercaseType = {
          ...mockPlayerData,
          user: {
            ...mockPlayerData.user,
            userType: 'PLAYER',
          },
        };

        prismaMock.player.findUnique.mockResolvedValue(playerWithUppercaseType);
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.data.userType).toBe('player');
      });

      it('should correctly transform experiences array', async () => {
        const playerWithMultipleExperiences = {
          ...mockPlayerData,
          experiences: [
            {
              id: 'exp-1',
              title: 'Senior Developer',
              company: 'Tech Corp',
              current: true,
              remote: true,
              startDate: new Date('2022-01-01'),
              endDate: null,
              skills: ['React', 'Node.js'],
              tools: ['VS Code', 'Git'],
              responsibilities: ['Lead development', 'Code review'],
            },
            {
              id: 'exp-2',
              title: 'Junior Developer',
              company: 'Startup Inc',
              current: false,
              remote: false,
              startDate: new Date('2020-01-01'),
              endDate: new Date('2021-12-31'),
              skills: ['JavaScript', 'HTML'],
              tools: ['Sublime Text'],
              responsibilities: ['Bug fixes', 'Feature development'],
            },
          ],
        };

        prismaMock.player.findUnique.mockResolvedValue(
          playerWithMultipleExperiences,
        );
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.data.experiences).toHaveLength(2);
        expect(result.data.experiences[0].id).toBe('exp-1');
        expect(result.data.experiences[1].id).toBe('exp-2');
      });

      it('should handle empty experiences array', async () => {
        const playerWithNoExperiences = {
          ...mockPlayerData,
          experiences: [],
        };

        prismaMock.player.findUnique.mockResolvedValue(playerWithNoExperiences);
        prismaMock.affiliate.findFirst.mockResolvedValue(null);

        const result = await service.getProfile('user-1');

        expect(result.data.experiences).toEqual([]);
      });
    });
  });

  describe('completeProfile', () => {
    const userId = 'user123';
    const playerId = 'player123';
    const mockPlayer = {
      id: playerId,
      onboardingSteps: [1, 2, 3, 4],
    };

    beforeEach(() => {
      prismaMock.player.findUnique.mockResolvedValue(mockPlayer);
    });

    describe('Player not found', () => {
      it('should throw NotFoundException when player does not exist', async () => {
        prismaMock.player.findUnique.mockResolvedValue(null);

        const dto: CompleteProfileDto = { step: 1 };

        await expect(service.completeProfile(userId, dto)).rejects.toThrow(
          NotFoundException,
        );
        expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
          where: { userId },
          select: { id: true, onboardingSteps: true },
        });
      });
    });

    describe('Step validation', () => {
      it('should throw BadRequestException when step is already completed', async () => {
        prismaMock.player.findUnique.mockResolvedValue({
          id: playerId,
          onboardingSteps: [2, 3, 4], // Step 1 already completed
        });

        const dto: CompleteProfileDto = { step: 1 };

        await expect(service.completeProfile(userId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.completeProfile(userId, dto)).rejects.toThrow(
          'Step 1 has already been completed',
        );
      });
    });

    describe('Step 1 - Basic Info', () => {
      const step1Dto: CompleteProfileDto = {
        step: 1,
        about: 'Test about',
        address: '123 Test St',
        shirtNumber: 10,
        birthYear: 1995,
        sportsHistory: 'Test history',
        industry: 'Technology',
        yearsOfExperience: 5,
      };

      it('should complete step 1 without avatar upload', async () => {
        const updatedPlayer = {
          ...mockPlayer,
          onboardingSteps: [2, 3, 4],
        };
        prismaMock.player.update.mockResolvedValue(updatedPlayer);

        const result = await service.completeProfile(userId, step1Dto);

        expect(prismaMock.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            about: 'Test about',
            address: '123 Test St',
            shirtNumber: 10,
            birthYear: 1995,
            sportsHistory: 'Test history',
            industry: 'Technology',
            yearsOfExperience: 5,
            onboardingSteps: [2, 3, 4],
          },
        });

        expect(result).toEqual({
          message: 'Step 1 completed successfully',
          data: {
            onboardingSteps: [2, 3, 4],
            completedStep: 1,
            isOnboardingComplete: false,
            nextStep: 2,
          },
        });
      });

      it('should complete step 1 with avatar upload', async () => {
        const mockFiles = {
          avatar: { originalname: 'avatar.jpg' } as Express.Multer.File,
        };
        const mockUploadResult = {
          publicUrl: 'https://example.com/avatar.jpg',
        };

        minioMock.uploadFile.mockResolvedValue(mockUploadResult);
        prismaMock.player.update.mockResolvedValue({
          ...mockPlayer,
          onboardingSteps: [2, 3, 4],
        });

        await service.completeProfile(userId, step1Dto, mockFiles);

        expect(minioMock.uploadFile).toHaveBeenCalledWith(
          mockFiles.avatar,
          userId,
          'avatar',
        );
        expect(prismaMock.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: expect.objectContaining({
            avatar: 'https://example.com/avatar.jpg',
          }),
        });
      });

      it('should throw InternalServerErrorException when avatar upload fails', async () => {
        const mockFiles = {
          avatar: { originalname: 'avatar.jpg' } as Express.Multer.File,
        };

        minioMock.uploadFile.mockRejectedValue(new Error('Upload failed'));

        await expect(
          service.completeProfile(userId, step1Dto, mockFiles),
        ).rejects.toThrow('Avatar upload failed');
      });
    });

    describe('Step 2 - Work Preferences', () => {
      const step2Dto: CompleteProfileDto = {
        step: 2,
        workLocations: ['USA', 'Canada'],
        employmentType: {
          primary: 'FULL_TIME' as any,
          secondary: ['PART_TIME' as any],
        },
        jobRole: {
          primary: 'Software Engineer',
          secondary: ['Frontend Developer'],
        },
      };

      it('should complete step 2 successfully', async () => {
        prismaMock.player.update.mockResolvedValue({
          ...mockPlayer,
          onboardingSteps: [1, 3, 4],
        });

        const result = await service.completeProfile(userId, step2Dto);

        expect(prismaMock.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            workCountry: ['USA', 'Canada'],
            employmentType: step2Dto.employmentType,
            jobRole: step2Dto.jobRole,
            onboardingSteps: [1, 3, 4],
          },
        });

        expect(result.data.completedStep).toBe(2);
      });

      it('should throw BadRequestException when workLocations exceed 5', async () => {
        const invalidDto: CompleteProfileDto = {
          step: 2,
          workLocations: ['USA', 'Canada', 'UK', 'Germany', 'France', 'Spain'],
        };

        await expect(
          service.completeProfile(userId, invalidDto),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.completeProfile(userId, invalidDto),
        ).rejects.toThrow('workLocations cannot exceed 5 locations');
      });
    });

    describe('Step 3 - Skills and Experience', () => {
      const step3Dto: CompleteProfileDto = {
        step: 3,
        traits: ['Leadership', 'Teamwork'],
        skills: ['JavaScript', 'TypeScript'],
        experiences: [
          {
            title: 'Software Engineer',
            company: 'TechCorp',
            current: true,
            remote: false,
            startDate: '2023-01-01',
            skills: ['React', 'Node.js'],
            tools: ['VS Code'],
            responsibilities: ['Code reviews'],
          },
        ],
        certifications: ['AWS Certified'],
        workAvailability: true,
      };

      it('should complete step 3 without file uploads', async () => {
        prismaMock.player.update.mockResolvedValue({
          ...mockPlayer,
          onboardingSteps: [1, 2, 4],
        });
        prismaMock.experience.createMany.mockResolvedValue({ count: 1 });

        const result = await service.completeProfile(userId, step3Dto);

        expect(prismaMock.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            traits: ['Leadership', 'Teamwork'],
            skills: ['JavaScript', 'TypeScript'],
            certifications: ['AWS Certified'],
            availability: true,
            onboardingSteps: [1, 2, 4],
          },
        });

        expect(prismaMock.experience.createMany).toHaveBeenCalledWith({
          data: [
            {
              playerId: playerId,
              title: 'Software Engineer',
              company: 'TechCorp',
              current: true,
              remote: false,
              startDate: new Date('2023-01-01'),
              endDate: null,
              companyPhone: undefined,
              companyEmail: undefined,
              skills: ['React', 'Node.js'],
              tools: ['VS Code'],
              responsibilities: ['Code reviews'],
            },
          ],
        });

        expect(result.data.completedStep).toBe(3);
      });

      it('should complete step 3 with resume and certifications upload', async () => {
        const mockFiles = {
          resume: { originalname: 'resume.pdf' } as Express.Multer.File,
          certifications0: {
            originalname: 'cert1.pdf',
          } as Express.Multer.File,
          certifications1: {
            originalname: 'cert2.pdf',
          } as Express.Multer.File,
        };

        minioMock.uploadFile
          .mockResolvedValueOnce({
            publicUrl: 'https://example.com/resume.pdf',
          })
          .mockResolvedValueOnce({ publicUrl: 'https://example.com/cert1.pdf' })
          .mockResolvedValueOnce({
            publicUrl: 'https://example.com/cert2.pdf',
          });

        prismaMock.player.update.mockResolvedValue({
          ...mockPlayer,
          onboardingSteps: [1, 2, 4],
        });
        prismaMock.experience.createMany.mockResolvedValue({ count: 1 });

        await service.completeProfile(userId, step3Dto, mockFiles);

        expect(minioMock.uploadFile).toHaveBeenCalledTimes(3);
        expect(minioMock.uploadFile).toHaveBeenCalledWith(
          mockFiles.resume,
          userId,
          'resume',
        );
        expect(minioMock.uploadFile).toHaveBeenCalledWith(
          mockFiles.certifications0,
          userId,
          'certification',
        );

        expect(prismaMock.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: expect.objectContaining({
            resume: 'https://example.com/resume.pdf',
            certifications: [
              'AWS Certified',
              'https://example.com/cert1.pdf',
              'https://example.com/cert2.pdf',
            ],
          }),
        });
      });

      it('should handle file upload failures gracefully', async () => {
        const mockFiles = {
          resume: { originalname: 'resume.pdf' } as Express.Multer.File,
        };

        minioMock.uploadFile.mockRejectedValue(new Error('upload failed'));

        await expect(
          service.completeProfile(userId, step3Dto, mockFiles),
        ).rejects.toThrow(InternalServerErrorException);
        await expect(
          service.completeProfile(userId, step3Dto, mockFiles),
        ).rejects.toThrow('File upload failed');
      });
    });

    describe('Step 4 - Security Setup', () => {
      const step4Dto: CompleteProfileDto = {
        step: 4,
      };

      it('should complete step 4 successfully (no special handling)', async () => {
        prismaMock.player.update.mockResolvedValue({
          ...mockPlayer,
          onboardingSteps: [], // All steps completed
        });

        const result = await service.completeProfile(userId, step4Dto);

        expect(prismaMock.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            onboardingSteps: mockPlayer.onboardingSteps.filter(
              (step) => step !== 4,
            ),
          },
        });

        expect(result).toEqual({
          message: 'Step 4 completed successfully',
          data: {
            onboardingSteps: [],
            completedStep: 4,
            isOnboardingComplete: true,
            nextStep: null,
          },
        });
      });
    });

    describe('Response building', () => {
      it('should return correct response when onboarding is complete', async () => {
        const dto: CompleteProfileDto = { step: 4 };
        prismaMock.player.update.mockResolvedValue({
          ...mockPlayer,
          onboardingSteps: [],
        });

        const result = await service.completeProfile(userId, dto);

        expect(result.data.isOnboardingComplete).toBe(true);
        expect(result.data.nextStep).toBe(null);
      });

      it('should return correct response when onboarding is not complete', async () => {
        const dto: CompleteProfileDto = { step: 1 };
        prismaMock.player.update.mockResolvedValue({
          ...mockPlayer,
          onboardingSteps: [2, 4],
        });

        const result = await service.completeProfile(userId, dto);

        expect(result.data.isOnboardingComplete).toBe(false);
        expect(result.data.nextStep).toBe(2); // Next smallest step
      });
    });

    describe('Error handling', () => {
      it('should throw InternalServerErrorException on unexpected database errors', async () => {
        prismaMock.player.findUnique.mockRejectedValue(new Error('DB Error'));

        const dto: CompleteProfileDto = { step: 1 };

        await expect(service.completeProfile(userId, dto)).rejects.toThrow(
          InternalServerErrorException,
        );
        await expect(service.completeProfile(userId, dto)).rejects.toThrow(
          'Failed to update player profile',
        );
      });

      it('should preserve BadRequestException and NotFoundException', async () => {
        prismaMock.player.findUnique.mockResolvedValue(null);

        const dto: CompleteProfileDto = { step: 1 };

        await expect(service.completeProfile(userId, dto)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('updateProfile', () => {
    const userId = 'user123';
    const playerId = 'player123';
    const mockPlayer = {
      id: playerId,
      userId: userId,
    };

    let capturedTx: any;

    beforeEach(() => {
      jest.clearAllMocks();
      prismaMock.player.findUnique.mockResolvedValue(mockPlayer);

      // Set up the transaction mock to capture the transaction object
      prismaMock.$transaction.mockImplementation(async (callback) => {
        capturedTx = {
          player: { update: jest.fn().mockResolvedValue(mockPlayer) },
          experience: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(capturedTx);
      });
    });

    describe('Player validation', () => {
      it('should throw NotFoundException when player does not exist', async () => {
        prismaMock.player.findUnique.mockResolvedValue(null);

        const dto: UpdateProfileDto = { name: 'John Doe' };

        await expect(service.updateProfile(userId, dto)).rejects.toThrow(
          NotFoundException,
        );
        expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
          where: { userId },
          select: { id: true, userId: true },
        });
      });
    });

    describe('Basic field updates', () => {
      const basicUpdateDto: UpdateProfileDto = {
        name: 'John Doe',
        about: 'Updated about',
        country: 'Canada',
        address: '456 New St',
        workAvailability: true,
        yearsOfExperience: 7,
        shirtNumber: 15,
        birthYear: 1990,
        sportsHistory: 'Updated sports history',
        industry: 'Finance',
      };

      it('should update basic profile fields successfully', async () => {
        const result = await service.updateProfile(userId, basicUpdateDto);

        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            user: { update: { name: 'John Doe' } },
            about: 'Updated about',
            country: 'Canada',
            address: '456 New St',
            workAvailability: true,
            yearsOfExperience: 7,
            shirtNumber: 15,
            birthYear: 1990,
            sportsHistory: 'Updated sports history',
            industry: 'Finance',
          },
        });

        expect(result).toEqual({
          message: 'Player profile updated successfully',
        });
      });

      it('should update array fields correctly', async () => {
        const arrayFieldsDto: UpdateProfileDto = {
          workLocations: ['USA', 'UK'],
          traits: ['Leadership', 'Communication'],
          skills: ['React', 'Node.js'],
          certifications: ['AWS', 'Azure'],
        };

        await service.updateProfile(userId, arrayFieldsDto);

        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            workCountry: ['USA', 'UK'],
            traits: ['Leadership', 'Communication'],
            skills: ['React', 'Node.js'],
            certifications: ['AWS', 'Azure'],
          },
        });
      });

      it('should update complex nested objects correctly', async () => {
        const complexDto: UpdateProfileDto = {
          employmentType: {
            primary: 'FULL_TIME' as any,
            secondary: ['PART_TIME' as any, 'CONTRACT' as any],
          },
          jobRole: {
            primary: 'Senior Developer',
            secondary: ['Team Lead', 'Architect'],
          },
        };

        await service.updateProfile(userId, complexDto);

        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            employmentType: complexDto.employmentType,
            jobRole: complexDto.jobRole,
          },
        });
      });
    });

    describe('File uploads', () => {
      it('should handle single file upload successfully', async () => {
        const mockFiles = {
          avatar: { originalname: 'avatar.jpg' } as Express.Multer.File,
        };
        const mockUploadResult = {
          publicUrl: 'https://example.com/avatar.jpg',
        };

        minioMock.uploadFile.mockResolvedValue(mockUploadResult);

        const dto: UpdateProfileDto = { name: 'John Doe' };

        await service.updateProfile(userId, dto, mockFiles);

        expect(minioMock.uploadFile).toHaveBeenCalledWith(
          mockFiles.avatar,
          userId,
          'avatar',
        );
        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            user: { update: { name: 'John Doe' } },
            avatar: 'https://example.com/avatar.jpg',
          },
        });
      });

      it('should handle multiple file uploads successfully', async () => {
        const mockFiles = {
          avatar: { originalname: 'avatar.jpg' } as Express.Multer.File,
          banner: { originalname: 'banner.jpg' } as Express.Multer.File,
          resume: { originalname: 'resume.pdf' } as Express.Multer.File,
        };

        minioMock.uploadFile
          .mockResolvedValueOnce({
            publicUrl: 'https://example.com/avatar.jpg',
          })
          .mockResolvedValueOnce({
            publicUrl: 'https://example.com/banner.jpg',
          })
          .mockResolvedValueOnce({
            publicUrl: 'https://example.com/resume.pdf',
          });

        const dto: UpdateProfileDto = { name: 'John Doe' };

        await service.updateProfile(userId, dto, mockFiles);

        expect(minioMock.uploadFile).toHaveBeenCalledTimes(3);
        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            user: { update: { name: 'John Doe' } },
            avatar: 'https://example.com/avatar.jpg',
            banner: 'https://example.com/banner.jpg',
            resume: 'https://example.com/resume.pdf',
          },
        });
      });

      it('should handle certification uploads correctly', async () => {
        const mockFiles = {
          certifications: [
            { originalname: 'cert1.pdf' } as Express.Multer.File,
            { originalname: 'cert2.pdf' } as Express.Multer.File,
          ],
        };

        minioMock.uploadFile
          .mockResolvedValueOnce({
            publicUrl: 'https://example.com/cert1.pdf',
          })
          .mockResolvedValueOnce({
            publicUrl: 'https://example.com/cert2.pdf',
          });

        const dto: UpdateProfileDto = {
          name: 'John Doe',
          certifications: ['existing-cert.pdf'],
        };

        await service.updateProfile(userId, dto, mockFiles);

        expect(minioMock.uploadFile).toHaveBeenCalledTimes(2);
        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            user: { update: { name: 'John Doe' } },
            certifications: [
              'https://example.com/cert1.pdf',
              'https://example.com/cert2.pdf',
            ],
          },
        });
      });

      it('should continue processing when some file uploads fail', async () => {
        const mockFiles = {
          avatar: { originalname: 'avatar.jpg' } as Express.Multer.File,
          resume: { originalname: 'resume.pdf' } as Express.Multer.File,
        };

        minioMock.uploadFile
          .mockRejectedValueOnce(new Error('Avatar upload failed'))
          .mockResolvedValueOnce({
            publicUrl: 'https://example.com/resume.pdf',
          });

        const dto: UpdateProfileDto = { name: 'John Doe' };

        const result = await service.updateProfile(userId, dto, mockFiles);

        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            user: { update: { name: 'John Doe' } },
            resume: 'https://example.com/resume.pdf',
            // avatar should not be included due to upload failure
          },
        });

        expect(result.message).toBe('Player profile updated successfully');
      });
    });

    describe('Experience updates', () => {
      // Create a fresh transaction mock for each test to avoid interference
      beforeEach(() => {
        prismaMock.$transaction.mockImplementation(async (callback) => {
          capturedTx = {
            player: { update: jest.fn().mockResolvedValue(mockPlayer) },
            experience: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
              createMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          };
          return callback(capturedTx);
        });
      });

      it('should update experiences successfully', async () => {
        const experiencesDto: UpdateProfileDto = {
          experiences: [
            {
              title: 'Senior Developer',
              company: 'TechCorp',
              current: true,
              remote: false,
              startDate: '2023-01-01',
              endDate: '2024-01-01',
              companyPhone: '+1234567890',
              companyEmail: 'hr@techcorp.com',
              skills: ['React', 'Node.js'],
              tools: ['VS Code', 'Docker'],
              responsibilities: ['Code reviews', 'Mentoring'],
            },
          ],
        };

        await service.updateProfile(userId, experiencesDto);

        // Verify transaction was called
        expect(prismaMock.$transaction).toHaveBeenCalled();

        // Verify experience operations were called
        expect(capturedTx.experience.deleteMany).toHaveBeenCalledWith({
          where: { playerId },
        });

        expect(capturedTx.experience.createMany).toHaveBeenCalledWith({
          data: [
            {
              playerId,
              title: 'Senior Developer',
              company: 'TechCorp',
              current: true,
              remote: false,
              startDate: new Date('2023-01-01'),
              endDate: new Date('2024-01-01'),
              companyPhone: '+1234567890',
              companyEmail: 'hr@techcorp.com',
              skills: ['React', 'Node.js'],
              tools: ['VS Code', 'Docker'],
              responsibilities: ['Code reviews', 'Mentoring'],
            },
          ],
        });
      });

      it('should handle experiences with optional fields', async () => {
        const minimalExperienceDto: UpdateProfileDto = {
          experiences: [
            {
              title: 'Developer',
              company: 'StartupCorp',
              // All other fields are optional and not provided
            },
          ],
        };

        await service.updateProfile(userId, minimalExperienceDto);

        expect(prismaMock.$transaction).toHaveBeenCalled();
        expect(capturedTx.experience.deleteMany).toHaveBeenCalledWith({
          where: { playerId },
        });
        expect(capturedTx.experience.createMany).toHaveBeenCalledWith({
          data: [
            {
              playerId,
              title: 'Developer',
              company: 'StartupCorp',
              current: false,
              remote: false,
              startDate: null,
              endDate: null,
              companyPhone: undefined,
              companyEmail: undefined,
              skills: [],
              tools: [],
              responsibilities: [],
            },
          ],
        });
      });

      it('should delete all experiences when empty array is provided', async () => {
        const emptyExperiencesDto: UpdateProfileDto = {
          experiences: [],
        };

        await service.updateProfile(userId, emptyExperiencesDto);

        expect(prismaMock.$transaction).toHaveBeenCalled();
        expect(capturedTx.experience.deleteMany).toHaveBeenCalledWith({
          where: { playerId },
        });
        expect(capturedTx.experience.createMany).not.toHaveBeenCalled();
      });

      it('should not process experiences when not provided', async () => {
        const dtoWithoutExperiences: UpdateProfileDto = {
          name: 'John Doe',
          // experiences is undefined/not provided
        };

        await service.updateProfile(userId, dtoWithoutExperiences);

        expect(prismaMock.$transaction).toHaveBeenCalled();
        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: { user: { update: { name: 'John Doe' } } },
        });
        // Experience operations should not be called when experiences is undefined
        expect(capturedTx.experience.deleteMany).not.toHaveBeenCalled();
        expect(capturedTx.experience.createMany).not.toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should return "No changes detected" when no data is provided', async () => {
        const emptyDto: UpdateProfileDto = {};

        const result = await service.updateProfile(userId, emptyDto);

        expect(result).toEqual({
          message: 'No changes detected',
        });

        expect(prismaMock.$transaction).not.toHaveBeenCalled();
      });

      it('should handle undefined values correctly', async () => {
        const dtoWithUndefined: UpdateProfileDto = {
          name: 'John Doe',
          about: undefined,
          country: '',
        };

        await service.updateProfile(userId, dtoWithUndefined);

        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            user: { update: { name: 'John Doe' } },
            country: '',
            // about should not be included since it's undefined
          },
        });
      });

      it('should process update when only files are uploaded', async () => {
        const mockFiles = {
          avatar: { originalname: 'avatar.jpg' } as Express.Multer.File,
        };

        minioMock.uploadFile.mockResolvedValue({
          publicUrl: 'https://example.com/avatar.jpg',
        });

        const result = await service.updateProfile(userId, {}, mockFiles);

        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: {
            avatar: 'https://example.com/avatar.jpg',
          },
        });

        expect(result.message).toBe('Player profile updated successfully');
      });
    });

    describe('Error handling', () => {
      it('should throw InternalServerErrorException on unexpected database errors', async () => {
        prismaMock.player.findUnique.mockRejectedValue(new Error('DB Error'));

        const dto: UpdateProfileDto = { name: 'John Doe' };

        await expect(service.updateProfile(userId, dto)).rejects.toThrow(
          InternalServerErrorException,
        );
        await expect(service.updateProfile(userId, dto)).rejects.toThrow(
          'Failed to update player profile',
        );
      });

      it('should preserve NotFoundException', async () => {
        prismaMock.player.findUnique.mockResolvedValue(null);

        const dto: UpdateProfileDto = { name: 'John Doe' };

        await expect(service.updateProfile(userId, dto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle database transaction failures', async () => {
        prismaMock.$transaction.mockRejectedValue(
          new Error('Transaction failed'),
        );

        const dto: UpdateProfileDto = { name: 'John Doe' };

        await expect(service.updateProfile(userId, dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });

      it('should handle experience update failures within transaction', async () => {
        const dto: UpdateProfileDto = {
          name: 'John Doe',
          experiences: [{ title: 'Developer', company: 'TechCorp' }],
        };

        prismaMock.$transaction.mockImplementation(async (callback) => {
          const mockTx = {
            player: { update: jest.fn().mockResolvedValue(mockPlayer) },
            experience: {
              deleteMany: jest
                .fn()
                .mockRejectedValue(new Error('Delete failed')),
              createMany: jest.fn(),
            },
          };
          return callback(mockTx);
        });

        await expect(service.updateProfile(userId, dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });

    describe('Transaction behavior', () => {
      it('should wrap player update in transaction', async () => {
        const dto: UpdateProfileDto = { name: 'John Doe' };

        await service.updateProfile(userId, dto);

        expect(prismaMock.$transaction).toHaveBeenCalled();
        expect(capturedTx.player.update).toHaveBeenCalledWith({
          where: { userId },
          data: { user: { update: { name: 'John Doe' } } },
        });
      });
    });
  });

  describe('getAllJobsByPlayer', () => {
    const playerId = 'player-id-123';
    const mockPlayer = {
      id: playerId,
      userId: 'user-id-123',
    };

    const mockJobs = [
      {
        id: 'job-1',
        title: 'Software Engineer',
        description: 'We are looking for a software engineer',
        type: 'FULL_TIME',
        location: 'New York, NY',
        tags: ['javascript', 'react'],
        status: JobStatus.ACTIVE,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
        company: {
          id: 'company-1',
          industry: 'TECHNOLOGY',
          address: '123 Tech St',
          country: 'USA',
          avatar: 'https://example.com/avatar.jpg',
          user: {
            name: 'Tech Corp',
          },
        },
      },
      {
        id: 'job-2',
        title: 'Product Manager',
        description: 'We are looking for a product manager',
        type: 'PART_TIME',
        location: 'San Francisco, CA',
        tags: ['product', 'management'],
        status: JobStatus.ACTIVE,
        createdAt: new Date('2024-01-16T10:30:00Z'),
        updatedAt: new Date('2024-01-16T10:30:00Z'),
        company: {
          id: 'company-2',
          industry: 'FINANCE',
          address: '456 Finance Ave',
          country: 'USA',
          avatar: 'https://example.com/avatar2.jpg',
          user: {
            name: 'Finance Corp',
          },
        },
      },
    ];

    const mockPlayerWithBookmarks = {
      bookmarks: [{ jobId: 'job-1' }],
    };

    const mockApplications = [
      { jobId: 'job-1', status: 'APPLIED' },
      { jobId: 'job-2', status: 'SHORTLISTED' },
    ];

    beforeEach(() => {
      prismaMock.player.findUnique.mockClear();
      prismaMock.job.findMany.mockClear();
      prismaMock.job.count.mockClear();
      prismaMock.company.findMany.mockClear();
      prismaMock.application.findMany.mockClear();
    });

    it('should return jobs with bookmark and application status', async () => {
      prismaMock.player.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayerWithBookmarks);
      prismaMock.job.findMany.mockResolvedValue(mockJobs);
      prismaMock.job.count.mockResolvedValue(2);
      prismaMock.application.findMany.mockResolvedValue(mockApplications);

      const query = {
        page: 1,
        limit: 10,
      };

      const result = await service.getAllJobsByPlayer(playerId, query);

      expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
        where: { id: playerId },
        select: { id: true, userId: true },
      });

      expect(prismaMock.job.findMany).toHaveBeenCalledWith({
        where: { status: JobStatus.ACTIVE },
        include: {
          company: {
            select: {
              id: true,
              industry: true,
              address: true,
              country: true,
              avatar: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prismaMock.job.count).toHaveBeenCalledWith({
        where: { status: JobStatus.ACTIVE },
      });

      expect(result).toEqual({
        success: true,
        message: 'Jobs fetched successfully',
        data: {
          data: [
            {
              id: 'job-1',
              title: 'Software Engineer',
              type: 'full_time',
              location: 'New York, NY',
              company: {
                id: 'company-1',
                name: 'Tech Corp',
                industry: 'TECHNOLOGY',
                avatar: 'https://example.com/avatar.jpg',
              },
              isBookmarked: true,
              applicationStatus: 'APPLIED',
            },
            {
              id: 'job-2',
              title: 'Product Manager',
              type: 'part_time',
              location: 'San Francisco, CA',
              company: {
                id: 'company-2',
                name: 'Finance Corp',
                industry: 'FINANCE',
                avatar: 'https://example.com/avatar2.jpg',
              },
              isBookmarked: false,
              applicationStatus: 'SHORTLISTED',
            },
          ],
          meta: {
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10,
          },
        },
      });
    });

    it('should filter by work types', async () => {
      prismaMock.player.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayerWithBookmarks);
      prismaMock.job.findMany.mockResolvedValue([mockJobs[0]]);
      prismaMock.job.count.mockResolvedValue(1);
      prismaMock.application.findMany.mockResolvedValue([]);

      const query = {
        page: 1,
        limit: 10,
        workTypes: [EmploymentType.FULL_TIME],
      };

      await service.getAllJobsByPlayer(playerId, query);

      expect(prismaMock.job.findMany).toHaveBeenCalledWith({
        where: {
          status: JobStatus.ACTIVE,
          type: {
            in: [EmploymentType.FULL_TIME],
          },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by search term', async () => {
      prismaMock.player.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayerWithBookmarks);
      prismaMock.job.findMany.mockResolvedValue([mockJobs[0]]);
      prismaMock.job.count.mockResolvedValue(1);
      prismaMock.application.findMany.mockResolvedValue([]);

      const query = {
        page: 1,
        limit: 10,
        search: 'software',
      };

      await service.getAllJobsByPlayer(playerId, query);

      expect(prismaMock.job.findMany).toHaveBeenCalledWith({
        where: {
          status: JobStatus.ACTIVE,
          OR: [
            { title: { contains: 'software', mode: 'insensitive' } },
            { description: { contains: 'software', mode: 'insensitive' } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by industry and regions', async () => {
      prismaMock.player.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayerWithBookmarks);
      prismaMock.company.findMany.mockResolvedValue([
        { id: 'company-1' },
        { id: 'company-2' },
      ]);
      prismaMock.job.findMany.mockResolvedValue([mockJobs[0]]);
      prismaMock.job.count.mockResolvedValue(1);
      prismaMock.application.findMany.mockResolvedValue([]);

      const query = {
        page: 1,
        limit: 10,
        industry: ['TECHNOLOGY'],
        regions: ['USA'],
      };

      await service.getAllJobsByPlayer(playerId, query);

      expect(prismaMock.company.findMany).toHaveBeenCalledWith({
        where: {
          industry: { in: ['TECHNOLOGY'] },
          country: { in: ['USA'] },
        },
        select: { id: true },
      });

      expect(prismaMock.job.findMany).toHaveBeenCalledWith({
        where: {
          status: JobStatus.ACTIVE,
          companyId: { in: ['company-1', 'company-2'] },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle pagination correctly', async () => {
      prismaMock.player.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayerWithBookmarks);
      prismaMock.job.findMany.mockResolvedValue([mockJobs[0]]);
      prismaMock.job.count.mockResolvedValue(25);
      prismaMock.application.findMany.mockResolvedValue([]);

      const query = {
        page: 2,
        limit: 10,
      };

      const result = await service.getAllJobsByPlayer(playerId, query);

      expect(prismaMock.job.findMany).toHaveBeenCalledWith({
        where: { status: JobStatus.ACTIVE },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });

      expect(result.data.meta).toEqual({
        total: 25,
        totalPages: 3,
        page: 2,
        limit: 10,
      });
    });

    it('should throw NotFoundException when player not found', async () => {
      prismaMock.player.findUnique.mockResolvedValue(null);

      const query = {
        page: 1,
        limit: 10,
      };

      await expect(service.getAllJobsByPlayer(playerId, query)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
        where: { id: playerId },
        select: { id: true, userId: true },
      });
    });

    it('should handle empty results', async () => {
      prismaMock.player.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce({ bookmarks: [] });
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(0);
      prismaMock.application.findMany.mockResolvedValue([]);

      const query = {
        page: 1,
        limit: 10,
      };

      const result = await service.getAllJobsByPlayer(playerId, query);

      expect(result).toEqual({
        success: true,
        message: 'Jobs fetched successfully',
        data: {
          data: [],
          meta: {
            total: 0,
            totalPages: 0,
            page: 1,
            limit: 10,
          },
        },
      });
    });

    it('should handle database errors', async () => {
      prismaMock.player.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const query = {
        page: 1,
        limit: 10,
      };

      await expect(service.getAllJobsByPlayer(playerId, query)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(service['logger'].error).toHaveBeenCalledWith(
        `Failed to fetch jobs for player ${playerId}:`,
        expect.any(Error),
      );
    });

    it('should handle player with no bookmarks', async () => {
      prismaMock.player.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce({ bookmarks: null });
      prismaMock.job.findMany.mockResolvedValue([mockJobs[0]]);
      prismaMock.job.count.mockResolvedValue(1);
      prismaMock.application.findMany.mockResolvedValue([]);

      const query = {
        page: 1,
        limit: 10,
      };

      const result = await service.getAllJobsByPlayer(playerId, query);

      expect(result.data.data[0].isBookmarked).toBe(false);
    });
  });

  describe('getJobsTrackingByPlayer', () => {
    const playerId = 'player-id-123';
    const mockPlayer = {
      id: playerId,
      userId: 'user-id-123',
    };

    const mockJobs = [
      {
        id: 'job-1',
        title: 'Software Engineer',
        type: 'FULL_TIME',
        status: 'ACTIVE',
        createdAt: new Date(),
        applications: [{ status: 'APPLIED' }],
        company: {
          id: 'company-1',
          user: { name: 'Tech Corp' },
          industry: 'Technology',
          address: '123 Tech Lane',
          country: 'USA',
          avatar: 'avatar.url',
        },
      },
    ];

    it('should return job tracking data successfully', async () => {
      prismaMock.player.findUnique.mockResolvedValue(mockPlayer);
      prismaMock.job.findMany.mockResolvedValue(mockJobs);
      prismaMock.job.count.mockResolvedValue(1);

      const result = await service.getJobsTrackingByPlayer(playerId, {});

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].id).toBe('job-1');
      expect(result.data.meta.total).toBe(1);
    });

    it('should throw NotFoundException if player not found', async () => {
      prismaMock.player.findUnique.mockResolvedValue(null);

      await expect(
        service.getJobsTrackingByPlayer(playerId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter by applicationStatus', async () => {
      prismaMock.player.findUnique.mockResolvedValue(mockPlayer);
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(0);

      await service.getJobsTrackingByPlayer(playerId, {
        applicationStatus: ['APPLIED'] as any,
      });

      expect(prismaMock.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            applications: {
              some: {
                playerId: playerId,
                status: { in: ['APPLIED'] },
              },
            },
          }),
        }),
      );
    });

    it('should filter by search query', async () => {
      prismaMock.player.findUnique.mockResolvedValue(mockPlayer);
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(0);

      await service.getJobsTrackingByPlayer(playerId, { search: 'Engineer' });

      expect(prismaMock.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'Engineer', mode: 'insensitive' } },
              { description: { contains: 'Engineer', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      prismaMock.player.findUnique.mockResolvedValue(mockPlayer);
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(10);

      await service.getJobsTrackingByPlayer(playerId, { page: 2, limit: 5 });

      expect(prismaMock.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });

    it('should return empty data array when no jobs found', async () => {
      prismaMock.player.findUnique.mockResolvedValue(mockPlayer);
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(0);

      const result = await service.getJobsTrackingByPlayer(playerId, {});

      expect(result.data.data).toHaveLength(0);
      expect(result.data.meta.total).toBe(0);
    });

    it('should throw InternalServerErrorException on db error', async () => {
      prismaMock.player.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.getJobsTrackingByPlayer(playerId, {}),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getJobByIdForPlayer', () => {
    const playerId = 'player-123';
    const jobId = 'job-123';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return job with bookmark and application status', async () => {
      const job = {
        id: jobId,
        title: 'Software Engineer',
        description: 'Build things',
        role: 'Engineer',
        type: 'FULL_TIME',
        location: 'Remote',
        experienceLevel: 'MID',
        mode: 'REMOTE',
        startDate: new Date(),
        endDate: new Date(),
        status: 'ACTIVE',
        openToAll: true,
        createdAt: new Date(),
        responsibilities: [],
        qualifications: [],
        skills: [],
        traits: [],
        clubs: [],
        tags: [],
        salary: {},
        applications: [{ status: 'APPLIED', createdAt: new Date() }],
        bookmarks: [{ id: 'bookmark-1' }],
        company: {
          id: 'company-1',
          industry: 'TECHNOLOGY',
          about: 'A company',
          address: '123 St',
          country: 'USA',
          avatar: 'avatar.url',
          user: { name: 'Tech Corp' },
        },
      };

      prismaMock.job.findUnique.mockResolvedValue(job as any);
      prismaMock.player.findUnique.mockResolvedValue({ id: playerId });

      const res = await service.getJobByIdForPlayer(playerId, jobId);

      expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
        where: { id: playerId },
        select: { id: true },
      });
      expect(prismaMock.job.findUnique).toHaveBeenCalledWith({
        where: { id: jobId },
        select: expect.objectContaining({
          id: true,
          title: true,
          description: true,
          role: true,
          type: true,
          location: true,
          experienceLevel: true,
          mode: true,
          startDate: true,
          endDate: true,
          status: true,
          openToAll: true,
          createdAt: true,
          responsibilities: true,
          qualifications: true,
          skills: true,
          traits: true,
          clubs: true,
          tags: true,
          salary: true,
          company: expect.any(Object),
          applications: expect.any(Object),
          bookmarks: expect.any(Object),
        }),
      });

      expect(res.success).toBe(true);
      expect(res.message).toBe('Job fetched successfully');
      expect(res.data).toMatchObject({
        id: jobId,
        title: 'Software Engineer',
        type: 'full_time',
        status: 'active',
        isBookmarked: true,
        applicationStatus: 'applied',
        company: {
          id: 'company-1',
          name: 'Tech Corp',
          avatar: 'avatar.url',
        },
      });
    });

    it('should set isBookmarked false and applicationStatus not_applied when none', async () => {
      const job = {
        id: jobId,
        title: 'PM',
        description: 'Lead things',
        role: 'Manager',
        type: 'PART_TIME',
        location: 'SF',
        experienceLevel: 'SENIOR',
        mode: 'HYBRID',
        startDate: new Date(),
        endDate: new Date(),
        status: 'ACTIVE',
        openToAll: false,
        createdAt: new Date(),
        responsibilities: [],
        qualifications: [],
        skills: [],
        traits: [],
        clubs: [],
        tags: [],
        salary: {},
        applications: [],
        bookmarks: [],
        company: {
          id: 'company-2',
          industry: 'FINANCE',
          about: 'A company',
          address: '456 Ave',
          country: 'USA',
          avatar: '',
          user: { name: 'Finance Corp' },
        },
      };

      prismaMock.player.findUnique.mockResolvedValue({
        id: playerId,
      });
      prismaMock.job.findUnique.mockResolvedValue(job as any);

      const res = await service.getJobByIdForPlayer(playerId, jobId);

      expect(res.data.isBookmarked).toBe(false);
      expect(res.data.applicationStatus).toBe('not_applied');
      expect(res.data.type).toBe('part_time');
    });

    it('should throw NotFoundException when player not found', async () => {
      prismaMock.player.findUnique.mockResolvedValue(null);

      await expect(
        service.getJobByIdForPlayer(playerId, jobId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when job not found', async () => {
      prismaMock.player.findUnique.mockResolvedValue({
        id: playerId,
        bookmarks: [],
      });
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(
        service.getJobByIdForPlayer(playerId, jobId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      prismaMock.job.findUnique.mockResolvedValue({
        id: jobId,
        startDate: new Date(),
        endDate: new Date(),
      });
      prismaMock.player.findUnique.mockRejectedValue(new Error('DB down'));

      await expect(
        service.getJobByIdForPlayer(playerId, jobId),
      ).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalled();
    });
  });

  describe('toggleJobBookmark', () => {
    const playerId = 'player-1';
    const jobId = 'job-1';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('adds bookmark when not existing', async () => {
      prismaMock.player.findUnique.mockResolvedValue({ id: playerId });
      prismaMock.job.findUnique.mockResolvedValue({ id: jobId });
      prismaMock.playerBookmark.findFirst.mockResolvedValue(null);
      prismaMock.playerBookmark.create.mockResolvedValue({ id: 'bm-1' });

      const res = await service.toggleJobBookmark(playerId, jobId);

      expect(prismaMock.playerBookmark.create).toHaveBeenCalledWith({
        data: { playerId, jobId },
        select: { id: true },
      });
      expect(res).toEqual({
        success: true,
        message: 'Bookmark added successfully',
      });
    });

    it('removes bookmark when existing', async () => {
      prismaMock.player.findUnique.mockResolvedValue({ id: playerId });
      prismaMock.job.findUnique.mockResolvedValue({ id: jobId });
      prismaMock.playerBookmark.findFirst.mockResolvedValue({ id: 'bm-1' });

      const res = await service.toggleJobBookmark(playerId, jobId);

      expect(prismaMock.playerBookmark.delete).toHaveBeenCalledWith({
        where: { id: 'bm-1' },
      });
      expect(res).toEqual({
        success: true,
        message: 'Bookmark removed successfully',
      });
    });

    it('throws NotFoundException when job not found', async () => {
      prismaMock.player.findUnique.mockResolvedValue({ id: playerId });
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.toggleJobBookmark(playerId, jobId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when player not found', async () => {
      prismaMock.player.findUnique.mockResolvedValue(null);
      prismaMock.job.findUnique.mockResolvedValue({ id: jobId });

      await expect(service.toggleJobBookmark(playerId, jobId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException on unexpected error', async () => {
      prismaMock.player.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(service.toggleJobBookmark(playerId, jobId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getDashboard', () => {
    const playerId = 'player-1';

    it('returns recommendations count', async () => {
      prismaMock.player.findUnique.mockResolvedValue({ id: playerId });
      prismaMock.job.count.mockResolvedValue(7);

      const res = await service.getDashboard(playerId);

      expect(prismaMock.job.count).toHaveBeenCalledWith({
        where: { status: JobStatus.ACTIVE },
      });
      expect(res).toEqual({
        success: true,
        message: 'Dashboard fetched successfully',
        data: { recommendations: 7 },
      });
    });

    it('throws NotFoundException if player not found', async () => {
      prismaMock.player.findUnique.mockResolvedValue(null);

      await expect(service.getDashboard(playerId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on db error', async () => {
      prismaMock.player.findUnique.mockRejectedValue(new Error('DB down'));

      await expect(service.getDashboard(playerId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

describe('getCompanies', () => {
  const query = { page: 1, limit: 10 };
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.chat.findMany.mockResolvedValue([]);
  });

  it('should return paginated companies and handle club affiliations', async () => {
    const mockCompaniesFromDb = [
      {
        id: 'company-1',
        industry: 'TECH',
        avatar: 'a1.png',
        secondaryAvatar: 'sa1.png',
        createdAt: new Date(),
        user: {
          id: 'user-company-1',
          name: 'Tech Corp',
          userType: 'COMPANY',
          affiliates: [
            {
              club: {
                id: 'club-1',
                preferredColor: '#FFFFFF',
                avatar: 'ca1.png',
                banner: 'cb1.png',
                user: {
                  name: 'Club One',
                },
              },
            },
          ],
        },
      },
      {
        id: 'company-2',
        industry: 'FINANCE',
        avatar: 'a2.png',
        secondaryAvatar: 'sa2.png',
        createdAt: new Date(),
        user: {
          id: 'user-company-2',
          name: 'Finance Inc',
          userType: 'COMPANY',
          affiliates: [],
        },
      },
    ];

    // Mock the transaction to return the array of results
    prismaMock.$transaction.mockResolvedValue([mockCompaniesFromDb, 2]);

    const result = await service.getCompanies(query, userId);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Companies fetched successfully');

    // Check the nested data structure
    expect(result.data).toHaveProperty('data');
    expect(result.data).toHaveProperty('meta');
    expect(result.data.data).toHaveLength(2);
    expect(result.data.meta.total).toBe(2);
    expect(result.data.meta.page).toBe(1);
    expect(result.data.meta.limit).toBe(10);

    // With affiliated club
    expect(result.data.data[0]).toMatchObject({
      id: 'company-1',
      name: 'Tech Corp',
      industry: 'TECH',
      avatar: 'a1.png',
      secondaryAvatar: 'sa1.png',
      userType: 'company', // lowercased
      club: {
        id: 'club-1',
        name: 'Club One',
        avatar: 'ca1.png',
        banner: 'cb1.png',
        preferredColor: '#FFFFFF',
      },
    });

    // Without club
    expect(result.data.data[1]).toMatchObject({
      id: 'company-2',
      name: 'Finance Inc',
      industry: 'FINANCE',
      avatar: 'a2.png',
      secondaryAvatar: 'sa2.png',
      userType: 'company',
      club: null,
    });

    // Verify transaction was called (don't check the parameters as they are promises)
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should return an empty list when no companies are found', async () => {
    // Mock the transaction to return empty results
    prismaMock.$transaction.mockResolvedValue([[], 0]);

    const result = await service.getCompanies(query, userId);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Companies fetched successfully');
    expect(result.data.data).toEqual([]);
    expect(result.data.meta.total).toBe(0);
    expect(result.data.meta.page).toBe(1);
    expect(result.data.meta.limit).toBe(10);

    // Verify the transaction was called
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should throw InternalServerErrorException on database error', async () => {
    prismaMock.$transaction.mockRejectedValue(new Error('DB Error'));

    await expect(service.getCompanies(query, userId)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should apply correct pagination parameters', async () => {
    const customQuery = { page: 2, limit: 5 };

    prismaMock.$transaction.mockResolvedValue([[], 0]);

    await service.getCompanies(customQuery, userId);

    // Just verify the transaction was called with the right number of arguments
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    // Get the actual call arguments to verify the structure
    const transactionCall = prismaMock.$transaction.mock.calls[0];
    expect(transactionCall).toHaveLength(1); // Should be called with one argument (array)
    expect(Array.isArray(transactionCall[0])).toBe(true); // That argument should be an array
    expect(transactionCall[0]).toHaveLength(2); // Array should contain 2 elements (findMany, count)
  });

  it('should handle companies with and without club affiliations correctly', async () => {
    const mockCompaniesFromDb = [
      {
        id: 'company-with-club',
        industry: 'TECH',
        avatar: null,
        secondaryAvatar: null,
        createdAt: new Date(),
        user: {
          id: 'user-company-with-club',
          name: 'Vixen Company',
          userType: 'COMPANY',
          affiliates: [
            {
              club: {
                id: '68cd72ce06ed994b31625974',
                preferredColor: '#4ECDC4',
                avatar:
                  'https://ui-avatars.com/api/?name=Club1&background=random',
                banner: 'https://picsum.photos/800/200?random=1',
                user: {
                  name: 'Sports Club 1',
                },
              },
            },
          ],
        },
      },
      {
        id: 'company-without-club',
        industry: null,
        avatar: null,
        secondaryAvatar: null,
        createdAt: new Date(),
        user: {
          id: 'user-company-without-club',
          name: 'JOh',
          userType: 'COMPANY',
          affiliates: [],
        },
      },
    ];

    prismaMock.$transaction.mockResolvedValue([mockCompaniesFromDb, 2]);

    const result = await service.getCompanies(query, userId);

    expect(result.success).toBe(true);
    expect(result.data.data).toHaveLength(2);

    // Company with club
    expect(result.data.data[0]).toMatchObject({
      id: 'company-with-club',
      name: 'Vixen Company',
      industry: 'TECH',
      avatar: null,
      secondaryAvatar: null,
      userType: 'company',
      club: {
        id: '68cd72ce06ed994b31625974',
        name: 'Sports Club 1',
        avatar: 'https://ui-avatars.com/api/?name=Club1&background=random',
        banner: 'https://picsum.photos/800/200?random=1',
        preferredColor: '#4ECDC4',
      },
    });

    // Company without club
    expect(result.data.data[1]).toMatchObject({
      id: 'company-without-club',
      name: 'JOh',
      industry: null,
      avatar: null,
      secondaryAvatar: null,
      userType: 'company',
      club: null,
    });
  });
});

  describe('applyForJob', () => {
    const jobId = 'job-123';
    const user = { userId: 'user-123' };
    const player = {
      id: 'player-123',
      user: { name: 'John Doe', email: 'john@example.com' },
    } as any;
    const dto = {
      phone: '090828347569',
      zip: '34567',
      legallyAuthorized: true,
      visaSponsorship: false,
      yearsOfExperience: 5,
    } as any;
    const resume = { originalname: 'cv.pdf' } as Express.Multer.File;
    const files = { resume };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('creates application successfully', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: jobId });
      prismaMock.player.findUnique.mockResolvedValue(player);
      prismaMock.application.findFirst.mockResolvedValue(null);
      minioMock.uploadFile.mockResolvedValue({
        publicUrl: 'https://cdn/resume.pdf',
      });
      prismaMock.application.create.mockResolvedValue({ id: 'app-1' });

      const res = await service.applyForJob(jobId, dto, files, user.userId);

      expect(minioMock.uploadFile).toHaveBeenCalledWith(
        resume,
        user.userId,
        'resume',
      );
      expect(prismaMock.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          jobId: jobId,
          playerId: 'player-123',
          phone: '090828347569',
          zip: '34567',
          legallyAuthorized: true,
          visaSponsorship: false,
          yearsOfExperience: 5,
          resume: 'https://cdn/resume.pdf',
          status: expect.any(String),
        }),
      });
      expect(res).toEqual({
        message: 'Application created successfully',
        data: { applicationId: 'app-1' },
      });
    });

    it('throws NotFoundException when job not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(
        service.applyForJob(jobId, dto, files, user.userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when player not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: jobId });
      prismaMock.player.findUnique.mockResolvedValue(null);

      await expect(
        service.applyForJob(jobId, dto, files, user.userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when already applied', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: jobId });
      prismaMock.player.findUnique.mockResolvedValue(player);
      prismaMock.application.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.applyForJob(jobId, dto, files, user.userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException when upload fails', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: jobId });
      prismaMock.player.findUnique.mockResolvedValue(player);
      prismaMock.application.findFirst.mockResolvedValue(null);
      minioMock.uploadFile.mockRejectedValue(new Error('upload failed'));

      await expect(
        service.applyForJob(jobId, dto, files, user.userId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
