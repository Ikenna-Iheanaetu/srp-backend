import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AffiliateType,
  ApplicationStatus,
  JobStatus,
  Prisma,
  UserType,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompleteProfileDto, ExperienceDto } from './dto/complete-profile.dto';
import { MinioService } from 'src/utils/minio.utils';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApplyForJobDto } from './dto/apply-for-job.dto';
import { GetJobsByPlayerDto } from './dto/get-jobs-by-player.dto';
import { GetJobsTrackingDto } from './dto/get-jobs-tracking.dto';
import { createPaginationMeta, mapEmploymentType } from 'src/utils';
import {
  ProcessedJobApplicationFiles,
  ProcessedPlayerFiles,
} from './types/files.types';
import { GetPublicPlayersDto } from './dto/get-public-players.dto';
import { JobRoleJson } from 'src/types/json-models/job-role.type';
import { EmploymentTypeJson } from 'src/types/json-models/employment.type';
import { GetCompaniesForPlayerQueryDto } from './dto/get-companies-for-player-query.dto';

@Injectable()
export class PlayerSupporterService {
  private readonly logger = new Logger(PlayerSupporterService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async getCompanies(query: GetCompaniesForPlayerQueryDto, userId: string) {
    this.logger.log('Fetching companies for player/supporter');
    try {
      const { page = 1, limit = 10, search } = query;
      const skip = (page - 1) * limit;

      // Build where clause for search and user type filtering
      const whereClause = {
        user: {
          userType: UserType.COMPANY, // Only show companies to players/supporters
          ...(search && {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }),
        },
      };

      const [companies, total] = await this.prisma.$transaction([
        this.prisma.company.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            industry: true,
            avatar: true,
            secondaryAvatar: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                userType: true,
                affiliates: {
                  where: {
                    type: AffiliateType.COMPANY,
                    isApproved: true,
                  },
                  take: 1,
                  select: {
                    club: {
                      select: {
                        id: true,
                        preferredColor: true,
                        avatar: true,
                        banner: true,
                        user: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.company.count({ where: whereClause }),
      ]);

      // Fetch existing chats between the player and companies for performance
      const companyUserIds = companies.map((company) => company.user.id);
      const chats = await this.prisma.chat.findMany({
        where: {
          playerId: userId,
          companyId: { in: companyUserIds },
        },
        select: {
          id: true,
          companyId: true,
        },
      });

      // Create a map for efficient lookup: companyUserId -> chatId
      const chatMap = new Map(
        chats.map((chat) => [chat.companyId, chat.id]),
      );

      const data = companies.map((company) => {
        const affiliate = company.user.affiliates[0];
        const chatId = chatMap.get(company.user.id) || null;

        return {
          id: company.id,
          userId: company.user.id,
          name: company.user.name,
          industry: company.industry,
          avatar: company.avatar,
          secondaryAvatar: company.secondaryAvatar,
          userType: company.user.userType.toLowerCase(),
          chatId,
          club: affiliate?.club
            ? {
                id: affiliate.club.id,
                name: affiliate.club.user.name,
                avatar: affiliate.club.avatar,
                banner: affiliate.club.banner,
                preferredColor: affiliate.club.preferredColor,
              }
            : null,
        };
      });

      return {
        success: true,
        message: 'Companies fetched successfully',
        data: {
          data,
          ...createPaginationMeta(total, page, limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch companies:', error);
      throw new InternalServerErrorException('Failed to fetch companies');
    }
  }

  async deletePlayer(id: string) {
    this.logger.log(`Deleting player: ${id}`);

    try {
      const player = await this.prisma.player.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!player) {
        throw new NotFoundException('Player not found');
      }

      await this.prisma.$transaction(async (tx) => {
        await Promise.all([
          tx.application.deleteMany({ where: { playerId: id } }),
          tx.shortlisted.deleteMany({ where: { playerId: id } }),
          tx.notification.deleteMany({ where: { userId: player.userId } }),
          tx.refreshToken.deleteMany({ where: { userId: player.userId } }),
          tx.affiliate.deleteMany({ where: { userId: player.userId } }),
          tx.otpCode.deleteMany({ where: { userId: player.userId } }),
        ]);

        await tx.user.delete({ where: { id: player.userId } });
      });

      this.logger.log(`Successfully deleted player: ${id}`);

      return {
        success: true,
        message: 'Player and all related data deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to delete player ${id}:`, error);
      throw new InternalServerErrorException(
        'Failed to delete player. Please try again later.',
      );
    }
  }

  async getProfile(userId: string) {
    try {
      const [player, affiliate] = await Promise.all([
        this.prisma.player.findUnique({
          where: { userId },
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
        }),
        this.prisma.affiliate.findFirst({
          where: {
            userId,
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
        }),
      ]);

      if (!player) {
        throw new NotFoundException('Profile not found');
      }

      const profileData: any = {
        id: player.id,
        name: player.user.name,
        email: player.user.email,
        userType: player.user.userType.toLowerCase(),
        about: player.about,
        address: player.address,
        workLocations: player.workCountry as string[],
        traits: player.traits as string[],
        skills: player.skills as string[],
        resume: player.resume,
        phone: player.phone,
        workAvailability: player.workAvailability,
        experiences: player.experiences.map((exp) => ({
          id: exp.id,
          title: exp.title,
          company: exp.company,
          current: exp.current,
          remote: exp.remote,
          startDate: exp.startDate,
          endDate: exp.endDate,
          skills: exp.skills as string[],
          tools: exp.tools as string[],
          responsibilities: exp.responsibilities as string[],
        })),
        shirtNumber: player.shirtNumber,
        birthYear: player.birthYear,
        sportsHistory: player.sportsHistory,
        avatar: player.avatar,
        status: player.user.status.toLowerCase(),
        onboardingSteps: player.onboardingSteps as number[],
        yearsOfExperience: player.yearsOfExperience,
        certifications: player.certifications as string[],
        score: player.score,
        isQuestionnaireTaken: player.isQuestionnaireTaken,
        club: {
          id: affiliate?.club?.id,
          name: affiliate?.club?.user?.name,
          avatar: affiliate?.club?.avatar,
          banner: affiliate?.club?.banner,
          preferredColor: affiliate?.club?.preferredColor,
        },
        industry: player.industry,
        isApproved: affiliate?.isApproved,
      };

      const emp = player.employmentType as EmploymentTypeJson | null;
      if (emp?.primary) {
        profileData.employmentType = {
          primary: mapEmploymentType(emp.primary),
          secondary: emp.secondary?.map((s) => mapEmploymentType(s)),
        };
      }

      const jr = player.jobRole as JobRoleJson | null;
      if (jr?.primary) {
        profileData.jobRole = {
          primary: jr.primary.toLowerCase(),
          secondary: jr.secondary?.map((s) => s.toLowerCase()),
        };
      }

      if (player.isQuestionnaireTaken) {
        profileData.score = player.score;
        profileData.analysisResult = player.analysisResult;
      }

      return {
        success: true,
        message: 'Profile fetched successfully',
        data: profileData,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve player profile:', error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(
        'Failed to retrieve profile. Please try again later.',
      );
    }
  }

  async getPublicPlayers(query: GetPublicPlayersDto) {
    try {
      const { page = 1, limit = 10, search } = query;

      const where: Prisma.PlayerWhereInput = {};

      if (search) {
        where.user = {
          is: { name: { contains: search, mode: 'insensitive' } },
        };
      }

      const [players, total] = await Promise.all([
        this.prisma.player.findMany({
          where,
          select: {
            id: true,
            about: true,
            address: true,
            workCountry: true,
            traits: true,
            skills: true,
            avatar: true,
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.player.count({ where }),
      ]);

      const data = players.map((p) => ({
        id: p.id,
        name: p.user?.name ?? '',
        email: p.user?.email,
        about: p.about,
        address: p.address,
        workLocations: (p.workCountry as string[]) || [],
        traits: (p.traits as string[]) || [],
        skills: (p.skills as string[]) || [],
        avatar: p.avatar,
      }));

      return {
        success: true,
        message: 'Players fetched successfully',
        data: {
          data,
          ...createPaginationMeta(total, page, limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch players:', error);
      throw new InternalServerErrorException('Failed to fetch players');
    }
  }

  async getPublicPlayersList(query: { page?: number; limit?: number }) {
    try {
      const { page = 1, limit = 10 } = query;

      const [players, total] = await Promise.all([
        this.prisma.player.findMany({
          select: { id: true, user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.player.count(),
      ]);

      const data = players.map((p) => ({ id: p.id, name: p.user?.name ?? '' }));

      return {
        success: true,
        message: 'Players list fetched successfully',
        data,
        ...createPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.logger.error('Failed to fetch players list:', error);
      throw new InternalServerErrorException('Failed to fetch players list');
    }
  }

  async getPublicProfile(
    playerId: string,
    companyProfileId?: string,
    userType?: string,
  ) {
    try {
      // Get the player directly using playerId
      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          about: true,
          address: true,
          workAvailability: true,
          workCountry: true,
          employmentType: true,
          traits: true,
          skills: true,
          resume: true,
          phone: true,
          experiences: true,
          shirtNumber: true,
          birthYear: true,
          sportsHistory: true,
          avatar: true,
          yearsOfExperience: true,
          certifications: true,
          score: true,
          industry: true,
          jobRole: true,
          user: {
            select: {
              email: true,
              name: true,
              userType: true,
              status: true,
              id: true,
              affiliates: {
                where: { isApproved: true },
                select: {
                  club: {
                    select: {
                      id: true,
                      avatar: true,
                      banner: true,
                      preferredColor: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      });

      if (!player) {
        throw new NotFoundException('Player not found');
      }

      // Fetch existing chat if a company is viewing the profile
      let chatId: string | null = null;
      if (companyProfileId && userType === UserType.COMPANY) {
        this.trackPlayerView(companyProfileId, player.id).catch((err) =>
          this.logger.error(
            'Company - player profile background tracking failed:',
            err,
          ),
        );

        // Get company userId from companyProfileId
        const company = await this.prisma.company.findUnique({
          where: { id: companyProfileId },
          select: { userId: true },
        });

        if (company) {
          // Check for existing chat between company and player
          const chat = await this.prisma.chat.findFirst({
            where: {
              companyId: company.userId,
              playerId: player.user.id,
              status: { in: ['PENDING', 'ACCEPTED'] },
            },
            select: { id: true },
          });

          chatId = chat?.id || null;
        }
      }

      // Get the first approved affiliate's club (if exists)
      const affiliate = player.user?.affiliates?.[0];

      return {
        success: true,
        message: 'Profile fetched successfully',
        data: {
          id: player.id,
          userId: player.user.id,
          name: player.user?.name,
          email: player.user?.email,
          userType: player.user?.userType.toLowerCase(),
          about: player.about,
          address: player.address,
          workAvailability: player.workAvailability,
          workLocations: player.workCountry as string[],
          employmentType: player.employmentType,
          traits: player.traits as string[],
          skills: player.skills as string[],
          resume: player.resume,
          phone: player.phone,
          experiences: player.experiences as any[],
          shirtNumber: player.shirtNumber,
          birthYear: player.birthYear,
          sportsHistory: player.sportsHistory,
          avatar: player.avatar,
          status: player.user?.status?.toLowerCase(),
          yearsOfExperience: player.yearsOfExperience,
          certifications: player.certifications as string[],
          score: player.score || 0,
          chatId,
          club: affiliate?.club
            ? {
                id: affiliate.club.id,
                avatar: affiliate.club.avatar,
                banner: affiliate.club.banner,
                preferredColor: affiliate.club.preferredColor,
              }
            : {},
          industry: player.industry || '',
          jobRole: (player.jobRole as any)?.['primary']
            ? player.jobRole
            : undefined,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to fetch public profile:', error);
      throw new InternalServerErrorException('Failed to fetch public profile');
    }
  }

  async completeProfile(
    userId: string,
    dto: CompleteProfileDto,
    files?: ProcessedPlayerFiles,
  ) {
    try {
      const player = await this.prisma.player.findUnique({
        where: { userId },
        select: { id: true, onboardingSteps: true },
      });

      if (!player) {
        throw new NotFoundException('Player not found');
      }

      const onboardingSteps = player.onboardingSteps as number[];

      if (!onboardingSteps.includes(dto.step)) {
        throw new BadRequestException(
          `Step ${dto.step} has already been completed`,
        );
      }

      const updateData: Prisma.PlayerUpdateInput = {};

      switch (dto.step) {
        case 1:
          await this.handleStep1(dto, files, updateData, userId);
          break;
        case 2:
          this.handleStep2(dto, updateData);
          break;
        case 3:
          await this.handleStep3(dto, files, updateData, userId, player.id);
          break;
      }

      const updatedPlayer = await this.prisma.player.update({
        where: { userId },
        data: {
          ...updateData,
          onboardingSteps: onboardingSteps.filter((step) => step !== dto.step),
        },
      });

      const remainingSteps = updatedPlayer.onboardingSteps as number[];

      return {
        message: `Step ${dto.step} completed successfully`,
        data: {
          onboardingSteps: remainingSteps,
          completedStep: dto.step,
          isOnboardingComplete: remainingSteps.length === 0,
          nextStep:
            remainingSteps.length > 0 ? Math.min(...remainingSteps) : null,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      console.error('Error updating player profile:', error);
      throw new InternalServerErrorException('Failed to update player profile');
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    files?: ProcessedPlayerFiles,
  ) {
    try {
      const player = await this.prisma.player.findUnique({
        where: { userId },
        select: { id: true, userId: true },
      });

      if (!player) {
        throw new NotFoundException('Player not found');
      }

      const updateData = this.buildUpdateData(dto);

      const fileData = await this.handleFileUploads(files, userId);

      const finalUpdateData = { ...updateData, ...fileData };

      if (
        Object.keys(finalUpdateData).length === 0 &&
        dto.experiences === undefined
      ) {
        return { message: 'No changes detected' };
      }

      await this.prisma.$transaction(
        async (tx) => {
          await tx.player.update({
            where: { userId },
            data: finalUpdateData,
          });

          if (dto.experiences !== undefined) {
            await tx.experience.deleteMany({
              where: { playerId: player.id },
            });

            if (dto.experiences.length > 0) {
              await tx.experience.createMany({
                data: dto.experiences.map((exp) => ({
                  playerId: player.id,
                  title: exp.title,
                  company: exp.company,
                  current: exp.current ?? false,
                  remote: exp.remote ?? false,
                  startDate: exp.startDate ? new Date(exp.startDate) : null,
                  endDate: exp.endDate ? new Date(exp.endDate) : null,
                  companyPhone: exp.companyPhone,
                  companyEmail: exp.companyEmail,
                  skills: exp.skills || [],
                  tools: exp.tools || [],
                  responsibilities: exp.responsibilities || [],
                })),
              });
            }
          }
        },
        {
          maxWait: 6000,
          timeout: 5000,
        },
      );

      return { message: 'Player profile updated successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error updating player profile:', error);
      throw new InternalServerErrorException('Failed to update player profile');
    }
  }

  async getAllJobsByPlayer(playerId: string, query: GetJobsByPlayerDto) {
    this.logger.log(`Fetching jobs for player: ${playerId}`);

    try {
      const {
        page = 1,
        limit: take = 10,
        workTypes,
        search,
        industry,
        regions,
      } = query;

      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true, userId: true },
      });

      if (!player) {
        throw new NotFoundException('User not found');
      }

      const jobFilters: any = {
        status: JobStatus.ACTIVE,
      };

      if (workTypes && workTypes.length > 0) {
        jobFilters.type = {
          in: workTypes,
        };
      }

      if (search) {
        jobFilters.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const companyFilters: any = {};
      if (industry && industry.length > 0) {
        companyFilters.industry = { in: industry };
      }
      if (regions && regions.length > 0) {
        companyFilters.country = { in: regions };
      }

      if (Object.keys(companyFilters).length > 0) {
        const companies = await this.prisma.company.findMany({
          where: companyFilters,
          select: { id: true },
        });
        const companyIds = companies.map((c) => c.id);
        jobFilters.companyId = { in: companyIds };
      }

      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where: jobFilters,
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
          skip: (page - 1) * take,
          take,
        }),
        this.prisma.job.count({
          where: jobFilters,
        }),
      ]);

      const playerWithBookmarks = await this.prisma.player.findUnique({
        where: { id: playerId },
        select: {
          bookmarks: {
            select: { jobId: true },
          },
        },
      });

      const bookmarkedJobIds = new Set(
        playerWithBookmarks?.bookmarks?.map((bookmark) => bookmark.jobId) || [],
      );

      const applications = await this.prisma.application.findMany({
        where: { playerId },
        select: { jobId: true, status: true },
      });

      const applicationMap = new Map(
        applications.map((app) => [app.jobId, app.status]),
      );

      const jobsWithStatus = jobs.map((job) => ({
        id: job.id,
        title: job.title,
        type: job.type.toLowerCase(),
        location: job.location,
        company: {
          id: job.company.id,
          name: job.company.user.name || '',
          industry: job.company.industry,
          avatar: job.company.avatar || '',
        },
        isBookmarked: bookmarkedJobIds.has(job.id),
        applicationStatus: applicationMap.get(job.id) || 'not_applied',
      }));

      this.logger.log(
        `Returned ${jobsWithStatus.length} jobs for player ${playerId}`,
      );

      return {
        success: true,
        message: 'Jobs fetched successfully',
        data: {
          data: jobsWithStatus,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to fetch jobs for player ${playerId}:`, error);
      throw new InternalServerErrorException('Failed to fetch jobs');
    }
  }

  async getJobsTrackingByPlayer(playerId: string, query: GetJobsTrackingDto) {
    this.logger.log(`Fetching job tracking for player: ${playerId}`);

    try {
      // Optional: remove this if you don't need explicit "player not found".
      const exists = await this.prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (!exists) {
        throw new NotFoundException('User not found');
      }

      const { page = 1, limit = 10, search, applicationStatus } = query;
      const skip = (page - 1) * limit;

      const jobWhere: Prisma.JobWhereInput = {
        status: JobStatus.ACTIVE,
        applications: {
          some: {
            playerId,
            ...(applicationStatus?.length
              ? { status: { in: applicationStatus } }
              : {}),
          },
        },
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where: jobWhere,
          include: {
            applications: {
              where: { playerId },
              select: { status: true },
              take: 1,
            },
            company: {
              select: {
                id: true,
                industry: true,
                address: true,
                country: true,
                avatar: true,
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.job.count({ where: jobWhere }),
      ]);

      const transformedJobs = jobs.map((job) => ({
        id: job.id,
        title: job.title,
        type: job.type.toLowerCase(),
        status: job.status.toLowerCase(),
        createdAt: job.createdAt.toISOString(),
        applicationStatus:
          job.applications[0]?.status?.toLowerCase() ?? 'not_applied',
        company: {
          id: job.company.id,
          name: job.company.user.name,
          industry: job.company.industry,
          location: [job.company.address, job.company.country]
            .filter(Boolean)
            .join(', '),
          avatar: job.company.avatar,
        },
      }));

      return {
        success: true,
        message: 'Job tracking data fetched successfully',
        data: {
          data: transformedJobs,
          ...createPaginationMeta(total, page, limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch job tracking for player ${playerId}:`,
        error,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to fetch job tracking data',
      );
    }
  }

  async getJobByIdForPlayer(playerId: string, jobId: string) {
    this.logger.log(`Fetching job ${jobId} for player ${playerId}`);

    try {
      // Single optimized query with all necessary data
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        select: {
          // Job fields
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
          // JSON fields
          responsibilities: true,
          qualifications: true,
          skills: true,
          traits: true,
          clubs: true,
          tags: true,
          salary: true,
          // Related data
          company: {
            select: {
              id: true,
              industry: true,
              about: true,
              address: true,
              country: true,
              avatar: true,
              user: {
                select: { name: true },
              },
            },
          },
          // Player-specific data in single queries
          applications: {
            where: { playerId },
            select: { status: true, createdAt: true },
            take: 1,
          },
          bookmarks: {
            where: { playerId },
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const playerExists = await this.prisma.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
        },
      });

      if (!playerExists) {
        throw new NotFoundException('User not found');
      }

      const applicationStatus =
        job.applications[0]?.status?.toLowerCase() ?? 'not_applied';
      const isBookmarked = job.bookmarks.length > 0;

      const companyName = job.company.user.name || '';
      const jobStatusLower = job.status.toLowerCase();
      const jobTypeLower = job.type.toLowerCase();

      const data = {
        id: job.id,
        type: jobTypeLower,
        status: jobStatusLower as 'active' | 'inactive',
        title: job.title,
        description: job.description,
        responsibilities: (job.responsibilities as string[]) || [],
        qualifications: (job.qualifications as string[]) || [],
        skills: (job.skills as string[]) || [],
        traits: (job.traits as string[]) || [],
        startDate: job.startDate.toISOString(),
        salary: {
          min: (job.salary as any)?.min || 0,
          max: (job.salary as any)?.max || 0,
          currency: (job.salary as any)?.currency || 'USD',
        },
        openToAll: job.openToAll || false,
        tags: job.tags as string[] | undefined,
        role: job.role || `${job.title}:::|:::${job.title}`,
        location: job.location,
        createdAt: job.createdAt.toISOString(),
        appliedDate: job.applications[0]?.createdAt?.toISOString() || undefined,
        applicationStatus,
        match: 90, // TODO: Implement actual match calculation
        isBookmarked,
        applicationDeadline: job.endDate
          ? {
              date: job.endDate.toISOString(),
              description: 'Application deadline',
            }
          : undefined,
        company: {
          id: job.company.id,
          name: companyName,
          address: job.company.address || undefined,
          about: job.company.about || undefined,
          avatar: job.company.avatar || undefined,
        },
      };

      return {
        success: true,
        message: 'Job fetched successfully',
        data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Failed to fetch job ${jobId} for player ${playerId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch job');
    }
  }

  async toggleJobBookmark(playerId: string, jobId: string) {
    this.logger.log(`Toggling bookmark for player ${playerId} on job ${jobId}`);

    try {
      const [player, job] = await Promise.all([
        this.prisma.player.findUnique({
          where: { id: playerId },
          select: { id: true },
        }),
        this.prisma.job.findUnique({
          where: { id: jobId },
          select: { id: true },
        }),
      ]);

      if (!job) {
        throw new NotFoundException('Job not found');
      }
      if (!player) {
        throw new NotFoundException('Player not found');
      }

      const existing = await this.prisma.playerBookmark.findFirst({
        where: { playerId, jobId },
        select: { id: true },
      });

      if (existing) {
        await this.prisma.playerBookmark.delete({ where: { id: existing.id } });
        return { success: true, message: 'Bookmark removed successfully' };
      }

      await this.prisma.playerBookmark.create({
        data: { playerId, jobId },
        select: { id: true },
      });
      return { success: true, message: 'Bookmark added successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Failed to toggle bookmark for player ${playerId} and job ${jobId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to update bookmark');
    }
  }

  async getDashboard(playerId: string) {
    this.logger.log(`Fetching dashboard for player ${playerId}`);
    try {
      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true },
      });
      if (!player) {
        throw new NotFoundException('Player not found');
      }

      const recommendations = await this.prisma.job.count({
        where: { status: JobStatus.ACTIVE },
      });

      return {
        success: true,
        message: 'Dashboard fetched successfully',
        data: { recommendations },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Failed to fetch dashboard for player ${playerId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch dashboard');
    }
  }

  async applyForJob(
    jobId: string,
    dto: ApplyForJobDto,
    files: ProcessedJobApplicationFiles,
    userId: string,
  ) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const player = await this.prisma.player.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!player) {
        throw new NotFoundException('Player not found');
      }

      const existingApplication = await this.prisma.application.findFirst({
        where: {
          jobId,
          playerId: player.id,
        },
      });

      if (existingApplication) {
        throw new BadRequestException('You have already applied for this job');
      }

      // Upload resume file
      const resumeFile = files.resume;
      if (!resumeFile) {
        throw new BadRequestException('Resume file is required');
      }

      const resumeUrl = await this.minio.uploadFile(
        resumeFile,
        userId,
        'resume',
      );

      // Upload application letter if provided
      let applicationLetterUrl: string | undefined;
      const applicationLetterFile = files.applicationLetter;
      if (applicationLetterFile) {
        const applicationLetterUpload = await this.minio.uploadFile(
          applicationLetterFile,
          userId,
          'application-letter',
        );
        applicationLetterUrl = applicationLetterUpload.publicUrl;
      }

      // Create application data object
      const applicationData = {
        jobId,
        playerId: player.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        zip: dto.zip,
        legallyAuthorized: dto.legallyAuthorized,
        visaSponsorship: dto.visaSponsorship,
        yearsOfExperience: dto.yearsOfExperience,
        resume: resumeUrl.publicUrl,
        applicationLetter: applicationLetterUrl,
        status: ApplicationStatus.APPLIED,
      };

      const application = await this.prisma.application.create({
        data: applicationData,
      });

      return {
        message: 'Application created successfully',
        data: { applicationId: application.id },
      };
    } catch (error) {
      this.logger.error('Failed to apply for job:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to apply for job. Please try again later.',
      );
    }
  }

  private async handleStep1(
    dto: CompleteProfileDto,
    files: any,
    updateData: any,
    userId: string,
  ) {
    try {
      if (files?.avatar) {
        const { publicUrl } = await this.minio.uploadFile(
          files.avatar,
          userId,
          'avatar',
        );
        updateData.avatar = publicUrl;
      }

      if (dto.about) updateData.about = dto.about;
      if (dto.address) updateData.address = dto.address;
      if (dto.shirtNumber) updateData.shirtNumber = dto.shirtNumber;
      if (dto.birthYear) updateData.birthYear = dto.birthYear;
      if (dto.sportsHistory) updateData.sportsHistory = dto.sportsHistory;
      if (dto.industry) updateData.industry = dto.industry;
      if (dto.yearsOfExperience) {
        updateData.yearsOfExperience = dto.yearsOfExperience;
      }
    } catch (error) {
      console.error('Error in step 1 processing:', error);
      throw new InternalServerErrorException('Avatar upload failed');
    }
  }

  private handleStep2(dto: CompleteProfileDto, updateData: any) {
    try {
      if (dto.workLocations) {
        if (dto.workLocations.length > 5) {
          throw new BadRequestException(
            'workLocations cannot exceed 5 locations',
          );
        }
        updateData.workCountry = dto.workLocations;
      }

      const isEmploymentType = (obj: any): obj is EmploymentTypeJson => {
        return obj && typeof obj.primary === 'string';
      };

      const isJobRole = (obj: any): obj is JobRoleJson => {
        return (
          obj &&
          (typeof obj.primary === 'string' || Array.isArray(obj.secondary))
        );
      };

      if (isEmploymentType(dto.employmentType)) {
        updateData.employmentType = dto.employmentType;
      }

      if (isJobRole(dto.jobRole)) {
        updateData.jobRole = dto.jobRole;
      }
    } catch (error) {
      console.error('Error in step 2 processing:', error);

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException('Failed to process step 2 data');
    }
  }

  private async handleStep3(
    dto: CompleteProfileDto,
    files: any,
    updateData: any,
    userId: string,
    playerId: string,
  ) {
    try {
      if (files?.resume) {
        const { publicUrl } = await this.minio.uploadFile(
          files.resume,
          userId,
          'resume',
        );
        updateData.resume = publicUrl;
      } else if (dto.resume !== undefined) {
        updateData.resume = dto.resume;
      }

      const certificationFiles = [
        files?.certifications0,
        files?.certifications1,
        files?.certifications2,
        files?.certifications3,
        files?.certifications4,
      ].filter(Boolean);

      let uploadedCerts: string[] = [];
      if (certificationFiles.length > 0) {
        const uploadPromises = certificationFiles.map((file) =>
          this.minio
            .uploadFile(file, userId, 'certification')
            .then((result) => result.publicUrl),
        );
        uploadedCerts = await Promise.all(uploadPromises);
      }

      const existingCerts = Array.isArray(dto.certifications)
        ? dto.certifications.filter((c) => typeof c === 'string' && c.trim())
        : [];

      const finalCerts = [...existingCerts, ...uploadedCerts];
      if (finalCerts.length > 0) {
        updateData.certifications = finalCerts;
      }

      if (dto.traits) updateData.traits = dto.traits;
      if (dto.skills) updateData.skills = dto.skills;
      if (dto.experiences) {
        if (dto.experiences.length > 0) {
          await this.prisma.experience.createMany({
            data: dto.experiences.map((exp) => ({
              playerId: playerId,
              title: exp.title,
              company: exp.company,
              current: exp.current ?? false,
              remote: exp.remote ?? false,
              startDate: exp.startDate ? new Date(exp.startDate) : null,
              endDate: exp.endDate ? new Date(exp.endDate) : null,
              companyPhone: exp.companyPhone,
              companyEmail: exp.companyEmail,
              skills: exp.skills || [],
              tools: exp.tools || [],
              responsibilities: exp.responsibilities || [],
            })),
          });
        }
      }
      if (dto.workAvailability) {
        updateData.availability = dto.workAvailability;
      }
    } catch (error) {
      console.error('Error in step 3 processing:', error);
      if (error.message?.includes('upload')) {
        throw new InternalServerErrorException('File upload failed');
      }
      throw new InternalServerErrorException('Failed to process step 3 data');
    }
  }

  private buildUpdateData(dto: any) {
    const fieldMap = {
      name: 'user.update.name', // Maps to user.update.name
      about: 'about', // Maps to about
      country: 'country', // Maps to country
      address: 'address', // Maps to address
      workAvailability: 'workAvailability',
      yearsOfExperience: 'yearsOfExperience',
      shirtNumber: 'shirtNumber',
      birthYear: 'birthYear',
      sportsHistory: 'sportsHistory',
      industry: 'industry',
      workLocations: 'workCountry',
      employmentType: 'employmentType',
      jobRole: 'jobRole',
      traits: 'traits',
      skills: 'skills',
      certifications: 'certifications',
      resume: 'resume',
    };

    const updateData: any = {};

    Object.entries(fieldMap).forEach(([dtoField, dbPath]) => {
      if (dto[dtoField] !== undefined) {
        const keys = dbPath.split('.');
        let current = updateData;

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!(key in current)) {
            current[key] = {};
          }
          current = current[key];
        }

        // Set the final value
        current[keys[keys.length - 1]] = dto[dtoField];
      }
    });

    return updateData;
  }

  private async handleFileUploads(files: any, userId: string) {
    const fileData: any = {};

    if (!files) return fileData;

    const uploadTasks: Promise<{ field: string; url: string } | null>[] = [];

    if (files.avatar) {
      uploadTasks.push(
        this.minio
          .uploadFile(files.avatar, userId, 'avatar')
          .then((result) => ({ field: 'avatar', url: result.publicUrl }))
          .catch((err) => {
            console.error('Avatar upload failed:', err);
            return null;
          }),
      );
    }

    if (files.banner) {
      uploadTasks.push(
        this.minio
          .uploadFile(files.banner, userId, 'banner')
          .then((result) => ({ field: 'banner', url: result.publicUrl }))
          .catch((err) => {
            console.error('Banner upload failed:', err);
            return null;
          }),
      );
    }

    if (files.resume) {
      uploadTasks.push(
        this.minio
          .uploadFile(files.resume, userId, 'resume')
          .then((result) => ({ field: 'resume', url: result.publicUrl }))
          .catch((err) => {
            console.error('Resume upload failed:', err);
            return null;
          }),
      );
    }

    // Handle certifications
    const certFiles = files.certifications || [];

    if (certFiles.length > 0) {
      const certUploadTasks = certFiles.map((file) =>
        this.minio
          .uploadFile(file, userId, 'certification')
          .then((result) => result.publicUrl)
          .catch((err) => {
            console.error('Certification upload failed:', err);
            return null;
          }),
      );

      const certResults = await Promise.all(certUploadTasks);
      const uploadedCerts = certResults.filter(Boolean);

      if (uploadedCerts.length > 0) {
        fileData.certifications = uploadedCerts;
      }
    }

    // Process other file uploads
    const fileResults = await Promise.all(uploadTasks);
    fileResults.forEach((result) => {
      if (result) {
        fileData[result.field] = result.url;
      }
    });

    return fileData;
  }

  private async trackPlayerView(companyId: string, playerId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      });

      if (!company) return;

      // Use MongoDB's $pull and $push operators for atomic update
      await this.prisma.$runCommandRaw({
        update: 'companies',
        updates: [
          {
            q: { _id: { $oid: companyId } },
            u: [
              {
                $set: {
                  recentlyViewedPlayers: {
                    $slice: [
                      {
                        $concatArrays: [
                          [playerId],
                          {
                            $filter: {
                              input: {
                                $ifNull: ['$recentlyViewedPlayers', []],
                              },
                              cond: { $ne: ['$$this', playerId] },
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
    } catch (error) {
      this.logger.error('Failed to track player view:', error);
    }
  }
}
