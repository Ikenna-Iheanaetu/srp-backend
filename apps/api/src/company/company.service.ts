import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  AffiliateStatus,
  AffiliateType,
  ApplicationStatus,
  ChatStatus,
  JobStatus,
  OtpType,
  Prisma,
  ShortlistedStatus,
  UserStatus,
  UserType,
} from '@prisma/client';
import { EmailService } from 'src/email/email.service';
import type { RegionJson } from 'src/types/json-models/region.type';
import {
  MinioService,
  OtpUtilsService,
  createPaginationMeta,
  createPaginationParams,
  mapEmploymentType,
} from 'src/utils';

import { GetCompaniesDto } from './dto/get-companies.dto';
import { InviteCompanyDto } from './dto/invite-company.dto';
import { CompanyItemDto } from './dto/responses/get-company-response.dto';

// Import new DTOs
import { HttpService } from '@nestjs/axios';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompanyCompleteProfileDto } from './dto/complete-profile.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { GetHiredJobsQueryDto } from './dto/get-hired-jobs-query.dto';
import { GetJobsByCompanyQueryDto } from './dto/get-jobs-by-company-query.dto';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';
import { GetJobsWithShortlistedQueryDto } from './dto/get-jobs-with-shortlisted-query.dto';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';
import { HireCandidateDto } from './dto/hire-and-unhire-candidate.dto';
import { PostPartnerAnswersDto } from './dto/questionnaire.dto';
import { RemoveShortlistedPlayerDto } from './dto/remove-shortlisted-player.dto';
import { ShortlistPlayerDto } from './dto/shortlist-player.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  FileUploadConfig,
  OnboardingResult,
  ProcessedCompanyFiles,
  ProfileUpdateData,
} from './types';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly otpUtils: OtpUtilsService,
    private readonly minioService: MinioService,
    private readonly httpService: HttpService,
  ) {}

  private async uploadFile(
    file: Express.Multer.File,
    userId: string,
    folder: 'avatar' | 'secondaryAvatar' | 'banner',
    errorMessage: string,
  ): Promise<string> {
    try {
      const result = await this.minioService.uploadFile(file, userId, folder);
      return result.publicUrl;
    } catch (error) {
      this.logger.error(`File upload failed: ${errorMessage}`, error);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  /**
   * Process file uploads for profile completion
   */
  private async processFileUploads(
    files: ProcessedCompanyFiles | undefined,
    userId: string,
  ): Promise<Partial<ProfileUpdateData>> {
    if (!files) return {};

    const uploads: Record<string, Promise<string>> = {};
    const fileConfigs: FileUploadConfig[] = [
      {
        fieldName: 'avatar',
        folder: 'avatar',
        errorMessage: 'Avatar upload failed',
      },
      {
        fieldName: 'secondaryAvatar',
        folder: 'secondaryAvatar',
        errorMessage: 'Secondary avatar upload failed',
      },
      {
        fieldName: 'banner',
        folder: 'banner',
        errorMessage: 'Banner upload failed',
      },
    ];

    // Start all uploads in parallel
    for (const config of fileConfigs) {
      const file = files[config.fieldName as keyof ProcessedCompanyFiles];
      if (file) {
        uploads[config.fieldName] = this.uploadFile(
          file,
          userId,
          config.folder,
          config.errorMessage,
        );
      }
    }

    // Wait for all uploads to complete
    const results: Partial<ProfileUpdateData> = {};
    for (const [fieldName, uploadPromise] of Object.entries(uploads)) {
      (results as any)[fieldName] = await uploadPromise;
    }

    return results;
  }

  /**
   * Process step 1 specific data
   */
  private processStep1Data(
    dto: CompanyCompleteProfileDto,
  ): Partial<ProfileUpdateData> {
    const updateData: Partial<ProfileUpdateData> = {};

    // Add text fields if they exist
    const textFields: Array<keyof CompanyCompleteProfileDto> = [
      'industry',
      'about',
      'country',
      'address',
      'tagline',
    ];

    for (const field of textFields) {
      if (dto[field]) {
        (updateData as any)[field] = dto[field] as string;
      }
    }

    // Handle region validation and assignment
    if (dto.region) {
      if (dto.region.secondary && dto.region.secondary.length > 4) {
        throw new BadRequestException(
          'Secondary regions cannot have more than 4 values',
        );
      }
      updateData.region = dto.region as RegionJson;
    }

    return updateData;
  }

  /**
   * Update onboarding steps by removing completed step
   */
  private updateOnboardingSteps(
    currentSteps: number[],
    completedStep: number,
  ): number[] {
    return currentSteps.filter((step) => step !== completedStep);
  }

  /**
   * Calculate onboarding result data
   */
  private calculateOnboardingResult(
    onboardingSteps: number[],
    completedStep: number,
  ): OnboardingResult {
    return {
      onboardingSteps,
      completedStep,
      isOnboardingComplete: onboardingSteps.length === 0,
      nextStep:
        onboardingSteps.length > 0 ? Math.min(...onboardingSteps) : null,
    };
  }

  /**
   * Process text fields for profile updates
   */
  private processUpdateTextFields(
    dto: UpdateProfileDto,
  ): Partial<ProfileUpdateData> {
    const updateData: Partial<ProfileUpdateData> = {};

    // Handle text fields
    const textFields: Array<keyof UpdateProfileDto> = [
      'about',
      'country',
      'industry',
      'address',
      'tagline',
      'focus',
    ];

    for (const field of textFields) {
      if (dto[field] !== undefined) {
        (updateData as any)[field] = dto[field];
      }
    }

    // Handle array fields
    if (dto.preferredClubs !== undefined) {
      updateData.preferredClubs = dto.preferredClubs;
    }

    // Handle region validation and assignment
    if (dto.region) {
      if (dto.region.secondary && dto.region.secondary.length > 4) {
        throw new BadRequestException(
          'Secondary regions cannot have more than 4 values',
        );
      }
      updateData.region = dto.region as RegionJson;
    }

    return updateData;
  }

  /**
   * Public methods
   */

  async getJobsByCompany(companyId: string, q: GetJobsByCompanyQueryDto) {
    const { page, take, skip } = createPaginationParams(q.page, q.limit);

    this.logger.log(
      `Fetching jobs for company ${companyId} with page=${page} and limit=${take}`,
    );

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        avatar: true,
        user: { select: { name: true } },
      },
    });
    if (!company || !company.user) {
      throw new NotFoundException('Company not found');
    }

    // Build where clause for search
    const whereClause: any = {
      companyId: companyId,
      status: JobStatus.ACTIVE,
    };

    if (q.search) {
      whereClause.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
        { type: { contains: q.search, mode: 'insensitive' } },
        { location: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          responsibilities: true,
          qualifications: true,
          skills: true,
          traits: true,
          tags: true,
          role: true,
          location: true,
          salary: true,
          startDate: true,
          endDate: true,
          openToAll: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              preferredClubs: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          applications: {
            select: {
              createdAt: true,
              status: true,
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      }),
      this.prisma.job.count({
        where: whereClause,
      }),
    ]);

    // Transform jobs to match JobByCompany type
    const data = jobs.map((job) => ({
      id: job.id,
      type: mapEmploymentType(job.type),
      status: job.status.toLowerCase() as 'active' | 'inactive',
      title: job.title,
      description: job.description,
      responsibilities: (job.responsibilities as string[]) || [],
      qualifications: (job.qualifications as string[]) || [],
      skills: (job.skills as string[]) || [],
      traits: (job.traits as string[]) || [],
      startDate: job.startDate?.toISOString() || new Date().toISOString(),
      salary: {
        min: (job.salary as any)?.min || 0,
        max: (job.salary as any)?.max || 0,
        currency: (job.salary as any)?.currency || 'USD',
      },
      openToAll: job.openToAll || false,
      tags: job.tags as string[] | undefined,
      role: job.role,
      location: job.location,
      createdAt: job.createdAt.toISOString(),
      appliedDate: job.applications[0]?.createdAt?.toISOString() || undefined,
      applicationStatus:
        job.applications[0]?.status?.toLowerCase() ?? 'not_applied',
      match: 0,
      isBookmarked: false,
      applicationDeadline: job?.endDate
        ? {
            date: job?.endDate.toISOString(),
            description: 'Application deadline',
          }
        : undefined,
      company: {
        id: company.id,
        name: company.user.name,
        avatar: company.avatar || '',
      },
    }));

    return {
      success: true,
      message: 'Jobs fetched successfully',
      data: {
        data,
        ...createPaginationMeta(total, page, take),
      },
    };
  }

  async getCompanies(q: GetCompaniesDto) {
    const { page, take, skip } = createPaginationParams(q.page, q.limit);

    this.logger.log(`Fetching companies page=${page} limit=${take}`);

    try {
      const baseWhere: Prisma.CompanyWhereInput = {
        user: {
          affiliates: {
            some: {
              isApproved: true,
              type: AffiliateType.COMPANY,
            },
          },
          name: q.search
            ? {
                contains: q.search,
                mode: 'insensitive',
              }
            : { not: null },
          status: q.status || UserStatus.ACTIVE,
        },
      };

      const [total, companies] = await Promise.all([
        this.prisma.company.count({ where: baseWhere }),
        this.prisma.company.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            user: {
              select: {
                name: true,
                affiliates: {
                  where: {
                    isApproved: true,
                    type: AffiliateType.COMPANY,
                  },
                  select: {
                    club: {
                      select: {
                        id: true,
                        avatar: true,
                        user: { select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
            jobs: {
              where: {
                status: JobStatus.ACTIVE,
              },
              select: {
                id: true,
                applications: {
                  where: { status: ApplicationStatus.SHORTLISTED },
                  select: { id: true },
                },
              },
            },
          },
        }),
      ]);

      const rows: CompanyItemDto[] = companies.map((company) => {
        const affiliate = company.user.affiliates[0];
        const clubEntity = affiliate?.club;
        const clubPayload = clubEntity?.user?.name
          ? {
              id: clubEntity.id,
              name: clubEntity.user.name,
              avatar: clubEntity.avatar,
            }
          : null;

        return {
          id: company.id,
          name: company.user.name!,
          club: clubPayload,
        } as CompanyItemDto;
      });

      this.logger.log(`Returned ${rows.length} companies`);

      return {
        success: true,
        message: 'Companies fetched successfully',
        data: {
          data: rows,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch companies:', error);
      throw new InternalServerErrorException(
        'Failed to fetch companies. Please try again later.',
      );
    }
  }

  async inviteCompanies(dto: InviteCompanyDto) {
    const { emails, clubId } = dto;
    this.logger.log(`Inviting companies for club ${clubId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { id: clubId },
        select: {
          id: true,
          refCode: true,
          user: { select: { name: true } },
        },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const processed: string[] = [];
      const skipped: { email: string; reason: string }[] = [];

      for (const email of emails) {
        try {
          const userExists = await this.prisma.user.findUnique({
            where: { email },
          });

          if (userExists) {
            skipped.push({
              email,
              reason: 'An account with this email already exists.',
            });
            continue;
          }

          const inviteExists = await this.prisma.affiliate.findFirst({
            where: { email, clubId, type: AffiliateType.COMPANY },
          });

          if (inviteExists) {
            skipped.push({
              email,
              reason:
                'An invitation has already been sent to this email for this club.',
            });
            continue;
          }

          const affiliate = await this.prisma.affiliate.create({
            data: {
              type: AffiliateType.COMPANY,
              email,
              clubId: club.id,
              status: AffiliateStatus.PENDING,
              refCode: club.refCode,
              byAdmin: true,
              isApproved: true,
            },
            select: {
              id: true,
            },
          });

          const otp = await this.otpUtils.generateAndSaveOtp(
            email,
            OtpType.AFFILIATE_INVITE,
            undefined,
            affiliate.id,
          );

          await this.emailService.sendCompanyInviteEmail(
            email,
            club.user?.name || '',
            club.refCode,
            otp,
          );

          processed.push(email);
        } catch (emailError) {
          this.logger.error(
            `Failed to process invitation for ${email}:`,
            emailError,
          );
          skipped.push({
            email,
            reason: 'Failed to send invitation due to system error',
          });
        }
      }

      this.logger.log(
        `Processed ${processed.length} invites, skipped ${skipped.length}`,
      );

      return {
        success: true,
        message: 'Company invitation(s) sent successfully.',
        data: {
          processedEmails: processed,
          skippedEmails: skipped,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to process company invitations:', error);
      throw new InternalServerErrorException(
        'Failed to process company invitations. Please try again later.',
      );
    }
  }

  async deleteCompany(companyId: string) {
    this.logger.log(`Deleting company: ${companyId}`);

    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, userId: true },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      await this.prisma.$transaction(async (tx) => {
        const jobs = await tx.job.findMany({
          where: { companyId },
          select: { id: true },
        });

        const jobIds = jobs.map((job) => job.id);

        if (jobIds.length > 0) {
          await Promise.all([
            tx.shortlisted.deleteMany({ where: { jobId: { in: jobIds } } }),
            tx.application.deleteMany({ where: { jobId: { in: jobIds } } }),
            tx.playerBookmark.deleteMany({ where: { jobId: { in: jobIds } } }),
          ]);

          await tx.job.deleteMany({ where: { companyId } });
        }

        await Promise.all([
          tx.task.deleteMany({ where: { companyId } }),
          tx.notification.deleteMany({ where: { userId: company.userId } }),
          tx.affiliate.deleteMany({ where: { userId: company.userId } }),
        ]);

        await tx.user.delete({ where: { id: company.userId } });
      });

      this.logger.log(`Successfully deleted company: ${companyId}`);

      return {
        success: true,
        message: 'Company and all related data deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to delete company ${companyId}:`, error);
      throw new InternalServerErrorException(
        'Failed to delete company. Please try again later.',
      );
    }
  }

  async getCompanyHiredPlayers(
    companyId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    this.logger.log(`Fetching hired players for company: ${companyId}`);

    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: { user: { select: { name: true } } },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const jobs = await this.prisma.job.findMany({
        where: { companyId, status: JobStatus.ACTIVE },
        select: { id: true },
      });

      const jobIds = jobs.map((job) => job.id);

      const emptyResponse = {
        success: true,
        message: 'Fetched hired players successfully',
        data: {
          data: [],
          ...createPaginationMeta(0, page, limit),
        },
      };

      if (jobIds.length === 0) {
        return emptyResponse;
      }

      const [shortlisted, total] = await Promise.all([
        this.prisma.shortlisted.findMany({
          //TODO:: Create an enum for the shortlisted status
          where: { jobId: { in: jobIds } },
          include: {
            player: {
              include: { user: { select: { name: true, userType: true } } },
            },
            job: { select: { id: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.shortlisted.count({
          where: { jobId: { in: jobIds } },
        }),
      ]);

      if (shortlisted.length === 0) {
        return emptyResponse;
      }

      const playerUserIds = shortlisted.map((s) => s.player.userId);
      const applicationLookups = shortlisted.map((s) => ({
        playerId: s.player.id,
        jobId: s.job.id,
      }));

      const [applications, affiliates] = await Promise.all([
        this.prisma.application.findMany({
          where: { OR: applicationLookups },
          select: { playerId: true, jobId: true, status: true },
        }),
        this.prisma.affiliate.findMany({
          where: {
            userId: { in: playerUserIds },
            type: { in: [AffiliateType.PLAYER, AffiliateType.SUPPORTER] },
            isApproved: true,
          },
          include: {
            club: {
              select: { id: true, avatar: true },
              include: { user: { select: { name: true } } },
            },
          },
        }),
      ]);

      // Each player can only have ONE active and approved affiliate;
      const applicationMap = new Map(
        applications.map((app) => [`${app.playerId}-${app.jobId}`, app.status]),
      );
      const affiliateMap = new Map(affiliates.map((a) => [a.userId, a]));

      const formattedPlayers = shortlisted.map((s) => {
        const player = s.player;
        const affiliate = affiliateMap.get(player.userId);
        const applicationStatus = applicationMap.get(
          `${player.id}-${s.job.id}`,
        );

        return {
          id: player.id,
          name: player.user.name,
          affiliateType: player.user.userType.toLowerCase(),
          club: affiliate?.club
            ? {
                id: affiliate.club.id,
                name: affiliate.club.user?.name,
                avatar: affiliate.club.avatar,
              }
            : undefined,
          status: applicationStatus,
        };
      });

      return {
        success: true,
        message: 'Fetched hired players successfully',
        data: {
          data: formattedPlayers,
          ...createPaginationMeta(total, page, limit),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to fetch company hired players:`, error);
      throw new InternalServerErrorException('Failed to fetch hired players');
    }
  }

  // Company Profile Management
  async getProfile(companyId: string) {
    this.logger.log(`Fetching profile for company: ${companyId}`);

    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              status: true,
            },
          },
        },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Get affiliate information
      const affiliate = await this.prisma.affiliate.findFirst({
        where: { userId: company.userId },
        include: {
          club: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
              avatar: true,
              preferredColor: true,
              banner: true,
            },
          },
        },
      });

      const profileData = {
        id: company.id,
        name: company.user.name,
        email: company.user.email,
        availability: company.availability,
        userType: company.user.userType.toLowerCase(),
        region: company.region as RegionJson,
        address: company.address,
        onboardingSteps: company.onboardingSteps || [],
        about: company.about,
        avatar: company.avatar,
        secondaryAvatar: company.secondaryAvatar,
        tagline: company.tagline,
        industry: company.industry,
        focus: company.focus,
        status: company.user.status.toLowerCase(),
        preferredClubs: company.preferredClubs,
        country: company.country,
        isApproved: affiliate?.isApproved,
        club: affiliate?.club
          ? {
              id: affiliate.club.id,
              name: affiliate.club.user?.name,
              avatar: affiliate.club.avatar,
              preferredColor: affiliate.club.preferredColor,
              banner: affiliate.club.banner,
            }
          : {},
        isQuestionnaireTaken: company.isQuestionnaireTaken,
        score: company.isQuestionnaireTaken ? company.score : undefined,
        analysisResult: company.isQuestionnaireTaken
          ? company.analysisResult
          : undefined,
      };

      return {
        success: true,
        message: 'Company profile fetched successfully',
        data: profileData,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch company profile: ${companyId}`, error);
      throw new InternalServerErrorException('Failed to fetch company profile');
    }
  }

  async getPublicProfile(
    companyId: string,
    playerProfileId?: string,
    userType?: string,
  ) {
    this.logger.log(`Fetching public profile for company: ${companyId}`);

    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              status: true,
            },
          },
        },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Track company view if viewer is a player or supporter
      if (
        playerProfileId &&
        (userType === UserType.PLAYER || userType === UserType.SUPPORTER)
      ) {
        this.trackCompanyView(playerProfileId, company.id).catch((err) =>
          this.logger.error(
            'Player/Supporter - company profile background tracking failed:',
            err,
          ),
        );
      }

      const affiliate = await this.prisma.affiliate.findFirst({
        where: { userId: company.userId },
        include: {
          club: {
            select: {
              id: true,
              avatar: true,
              preferredColor: true,
              banner: true,
            },
          },
        },
      });

      // Check for existing chat if viewer is a player or supporter
      let existingChatId: string | null = null;
      if (
        playerProfileId &&
        (userType === UserType.PLAYER || userType === UserType.SUPPORTER)
      ) {
        // Get player userId from playerProfileId
        const player = await this.prisma.player.findUnique({
          where: { id: playerProfileId },
          select: { userId: true },
        });

        if (player) {
          const existingChat = await this.prisma.chat.findFirst({
            where: {
              companyId: company.userId,
              playerId: player.userId,
            },
            select: {
              id: true,
            },
          });
          existingChatId = existingChat?.id || null;
        }
      }

      return {
        success: true,
        message: 'Company profile fetched successfully',
        data: {
          id: company.id,
          userId: company.user.id,
          name: company.user.name || '',
          email: company.user.email,
          userType: company.user.userType.toLowerCase(),
          about: company.about,
          avatar: company.avatar,
          address: company.address,
          region: company.region as RegionJson | undefined,
          tagline: company.tagline,
          industry: company.industry,
          focus: company.focus,
          status: company.user.status.toLowerCase(),
          preferredClubs: company.preferredClubs,
          score: company.score,
          country: company.country,
          availability: company.availability,
          secondaryAvatar: company.secondaryAvatar,
          chatId: existingChatId,
          club: affiliate?.club
            ? {
                avatar: affiliate.club.avatar,
                preferredColor: affiliate.club.preferredColor,
                banner: affiliate.club.banner,
              }
            : {},
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch public company profile: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch company profile');
    }
  }

  async completeProfile(
    companyId: string,
    dto: CompanyCompleteProfileDto,
    files?: ProcessedCompanyFiles,
  ) {
    this.logger.log(
      `Completing profile for company: ${companyId}, step: ${dto.step}`,
    );

    try {
      // Fetch company information
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, userId: true, onboardingSteps: true },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Initialize update data with onboarding step removal
      const currentSteps = (company.onboardingSteps as number[]) || [];
      const updatedSteps = this.updateOnboardingSteps(currentSteps, dto.step);

      const updateData: ProfileUpdateData = {
        onboardingSteps: updatedSteps,
      };

      // Process file uploads in parallel (if any)
      const fileUploadData = await this.processFileUploads(
        files,
        company.userId,
      );
      Object.assign(updateData, fileUploadData);

      // Process step-specific data
      let stepData: Partial<ProfileUpdateData> = {};
      switch (dto.step) {
        case 1:
          stepData = this.processStep1Data(dto);
          break;
        default:
          this.logger.warn(`Unknown step: ${dto.step}`);
      }

      Object.assign(updateData, stepData);

      // Perform database update in a single transaction
      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: updateData,
        select: { onboardingSteps: true },
      });

      // Calculate and return result
      const finalSteps = (updatedCompany.onboardingSteps as number[]) || [];
      const result = this.calculateOnboardingResult(finalSteps, dto.step);

      return {
        success: true,
        message: 'Profile onboarding completed successfully',
        data: result,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to complete profile for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to update company profile',
      );
    }
  }

  async updateProfile(
    companyId: string,
    dto: UpdateProfileDto,
    files?: ProcessedCompanyFiles,
  ) {
    this.logger.log(`Updating profile for company: ${companyId}`);

    try {
      // Fetch company with minimal fields needed
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, userId: true },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Process file uploads in parallel (reuse existing method)
      const fileUploadData = await this.processFileUploads(
        files,
        company.userId,
      );

      // Process text fields and validation (reuse existing logic)
      const textData = this.processUpdateTextFields(dto);

      // Combine all update data
      const updateData = { ...textData, ...fileUploadData };

      // Check if there are any changes (company fields or user name)
      if (Object.keys(updateData).length === 0 && dto.name === undefined) {
        return {
          success: true,
          message: 'No changes detected',
        };
      }

      // Handle user name update in single transaction
      await this.prisma.$transaction(async (tx) => {
        // Update company fields
        if (Object.keys(updateData).length > 0) {
          await tx.company.update({
            where: { id: companyId },
            data: updateData,
          });
        }

        // Update user name if provided
        if (dto.name !== undefined) {
          await tx.user.update({
            where: { id: company.userId },
            data: { name: dto.name },
          });
        }
      });

      return {
        success: true,
        message: 'Company profile updated successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update profile for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to update company profile',
      );
    }
  }

  async getDashboard(companyId: string) {
    this.logger.log(`Fetching dashboard data for company: ${companyId}`);

    try {
      // Count active jobs
      const activeJobs = await this.prisma.job.count({
        where: { companyId, status: JobStatus.ACTIVE },
      });

      // Get recent applications
      const jobs = await this.prisma.job.findMany({
        where: { companyId, status: JobStatus.ACTIVE },
        select: { id: true },
      });

      const jobIds = jobs.map((job) => job.id);

      const applications = await this.prisma.application.findMany({
        where: { jobId: { in: jobIds } },
        include: {
          job: { select: { title: true } },
          player: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const mappedApplications = applications.map((app) => ({
        id: app.id,
        name: app.name,
        application: app.job.title,
        status: app.status.toLowerCase(),
        date: app.createdAt.toISOString(),
      }));

      // Count pending tasks
      const pendingTasks = await this.prisma.task.count({
        where: { companyId, status: 'TODO' },
      });

      const metrics = [
        {
          accessorKey: 'jobsPosting',
          value: activeJobs,
          title: 'Active Job Posting',
        },
        {
          accessorKey: 'newApplicants',
          value: applications.length,
          title: 'New Applications',
        },
      ];

      return {
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          pendingTasks,
          recruitmentGoals: {
            total: 0,
            achieved: 0,
          },
          metrics,
          applicants: mappedApplications,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch dashboard for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch dashboard data');
    }
  }

  // Shortlisting and Hiring Methods
  async shortlistPlayer(companyId: string, dto: ShortlistPlayerDto) {
    this.logger.log(
      `Shortlisting player ${dto.candidate} for company: ${companyId}`,
    );

    try {
      // De-duplicate incoming job IDs
      const requestedJobIds = Array.from(new Set(dto.jobs));

      if (requestedJobIds.length === 0) {
        return {
          success: true,
          message: 'No jobs provided',
        };
      }

      // Parallel fetch: valid jobs and existing shortlist entries
      const [jobs, existing] = await Promise.all([
        this.prisma.job.findMany({
          where: {
            id: { in: requestedJobIds },
            companyId,
            status: JobStatus.ACTIVE,
          },
          select: { id: true },
        }),
        this.prisma.shortlisted.findMany({
          where: {
            playerId: dto.candidate,
            jobId: { in: requestedJobIds },
          },
          select: { jobId: true },
        }),
      ]);

      const validJobIdSet = new Set(jobs.map((j) => j.id));
      const alreadyShortlistedSet = new Set(existing.map((e) => e.jobId));

      const invalidJobs = requestedJobIds.filter(
        (id) => !validJobIdSet.has(id),
      );

      const toCreateJobIds = requestedJobIds.filter(
        (id) => validJobIdSet.has(id) && !alreadyShortlistedSet.has(id),
      );

      // Batch create new shortlist entries
      if (toCreateJobIds.length > 0) {
        await this.prisma.shortlisted.createMany({
          data: toCreateJobIds.map((jobId) => ({
            playerId: dto.candidate,
            jobId,
          })),
        });
      }

      return {
        success: true,
        message: 'Candidate shortlisted successfully',
        invalidJobs,
        data: {
          alreadyShortlistedJobs: Array.from(alreadyShortlistedSet),
          createdForJobs: toCreateJobIds,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to shortlist player for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to shortlist candidate');
    }
  }

  async removeShortlistedPlayer(
    companyId: string,
    dto: RemoveShortlistedPlayerDto,
  ) {
    this.logger.log(
      `Removing player ${dto.candidate} from shortlist for company: ${companyId}`,
    );

    try {
      // De-duplicate incoming job IDs
      const requestedJobIds = Array.from(new Set(dto.jobs));

      if (requestedJobIds.length === 0) {
        return {
          success: true,
          message: 'No jobs provided',
        };
      }

      // Parallel fetch: valid jobs and existing shortlist entries
      const [jobs, existing] = await Promise.all([
        this.prisma.job.findMany({
          where: {
            id: { in: requestedJobIds },
            companyId,
            status: JobStatus.ACTIVE,
          },
          select: { id: true },
        }),
        this.prisma.shortlisted.findMany({
          where: {
            playerId: dto.candidate,
            jobId: { in: requestedJobIds },
          },
          select: { id: true, jobId: true },
        }),
      ]);

      const validJobIdSet = new Set(jobs.map((j) => j.id));
      const existingByJobId = new Map(existing.map((e) => [e.jobId, e.id]));

      const invalidJobs = requestedJobIds.filter(
        (id) => !validJobIdSet.has(id),
      );

      const notShortlistedJobs = requestedJobIds.filter(
        (id) => validJobIdSet.has(id) && !existingByJobId.has(id),
      );

      const toDeleteIds = existing
        .filter((e) => validJobIdSet.has(e.jobId))
        .map((e) => e.id);

      // Batch delete shortlist entries
      if (toDeleteIds.length > 0) {
        await this.prisma.shortlisted.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      return {
        success: true,
        message: 'Candidate removed from shortlist successfully',
        data: {
          invalidJobs,
          notShortlistedJobs,
          removedFromJobs: existing
            .filter((e) => validJobIdSet.has(e.jobId))
            .map((e) => e.jobId),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to remove player from shortlist for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to remove candidate from shortlist',
      );
    }
  }

  async getJobsWithShortlistedPlayers(
    companyId: string,
    query: GetJobsWithShortlistedQueryDto,
  ) {
    this.logger.log(
      `Fetching jobs with shortlisted players for company: ${companyId}`,
    );

    try {
      const { page, take, skip } = createPaginationParams(
        query.page,
        query.limit,
      );

      // Handle bracket notation for status parameter
      const search = query.search;
      const status = query['status[]'] || query.status;

      const where: Prisma.JobWhereInput = {
        companyId,
        shortlisted: { some: { status: ShortlistedStatus.NOT_HIRED } },
      };

      // Status filter - ACTIVE or INACTIVE only
      if (status?.length) {
        where.status =
          status.length === 1
            ? (status[0] as JobStatus)
            : { in: status as JobStatus[] };
      }

      // Search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Parallel queries
      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            role: true,
            type: true,
            status: true,
            location: true,
            salary: true,
            createdAt: true,
            updatedAt: true,
            shortlisted: {
              select: {
                player: { select: { avatar: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.job.count({ where }),
      ]);

      // Transform response
      const transformedJobs = jobs.map(({ shortlisted, ...job }) => ({
        ...job,
        shortlistedCount: shortlisted.length,
        shortlistedAvatars: shortlisted
          .map((entry) => entry.player?.avatar)
          .filter(Boolean) as string[],
      }));

      return {
        success: true,
        message: 'Jobs with shortlisted players fetched successfully',
        data: {
          data: transformedJobs,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch jobs with shortlisted players for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch jobs with shortlisted players',
      );
    }
  }

  async getShortlistedPlayers(
    companyId: string,
    jobId: string,
    query: PaginationQueryDto,
  ) {
    this.logger.log(
      `Fetching shortlisted players for job: ${jobId}, company: ${companyId}`,
    );

    try {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 10);

      const where: any = {
        jobId,
        job: { companyId },
      };

      // Add search functionality
      // if (query.search) {
      //   where.player = {
      //     user: {
      //       name: {
      //         contains: query.search,
      //         mode: 'insensitive'
      //       }
      //     }
      //   };
      // }

      const [players, total] = await Promise.all([
        this.prisma.shortlisted.findMany({
          where,
          select: {
            id: true,
            createdAt: true,
            player: {
              select: {
                id: true,
                avatar: true,
                resume: true,
                user: {
                  select: {
                    name: true,
                    userType: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.shortlisted.count({ where }),
      ]);

      if (players.length === 0 && total === 0) {
        const jobExists = await this.prisma.job.findFirst({
          where: { id: jobId, companyId },
          select: { id: true },
        });

        if (!jobExists) {
          throw new BadRequestException('Job does not exist');
        }
      }

      const formattedPlayers = players.map(({ player, createdAt }) => ({
        id: player.id,
        name: player.user.name,
        avatar: player.avatar,
        createdAt: createdAt.toISOString(),
        resume: player.resume,
        userType: player.user.userType.toLowerCase(),
      }));

      return {
        success: true,
        message: 'Shortlisted players fetched successfully',
        data: {
          data: formattedPlayers,
          meta: {
            total,
            totalPages: Math.ceil(total / limit),
            page,
            limit,
          },
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch shortlisted players for job: ${jobId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch shortlisted players',
      );
    }
  }

  async removeAllShortlistedUnderJob(companyId: string, jobId: string) {
    this.logger.log(
      `Removing all shortlisted candidates for job: ${jobId}, company: ${companyId}`,
    );

    try {
      // Verify job belongs to company
      const job = await this.prisma.job.findFirst({
        where: { id: jobId, companyId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      await this.prisma.shortlisted.deleteMany({
        where: { jobId },
      });

      return {
        success: true,
        message: 'All shortlisted candidates removed successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to remove all shortlisted candidates for job: ${jobId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to remove shortlisted candidates',
      );
    }
  }

  async hireCandidate(companyId: string, dto: HireCandidateDto) {
    this.logger.log(
      `Hiring candidate ${dto.candidate} for job: ${dto.job}, company: ${companyId}`,
    );

    try {
      // Parallel validation: verify job ownership and shortlist status
      const [job, shortlist] = await Promise.all([
        this.prisma.job.findFirst({
          where: { id: dto.job, companyId },
          select: { id: true },
        }),
        this.prisma.shortlisted.findFirst({
          where: { jobId: dto.job, playerId: dto.candidate },
          select: { id: true, status: true },
        }),
      ]);

      if (!job) {
        throw new BadRequestException('Job does not exist');
      }

      if (!shortlist) {
        throw new BadRequestException(
          'Candidate was not shortlisted for this job',
        );
      }

      // Update shortlist status to HIRED
      await this.prisma.shortlisted.update({
        where: { id: shortlist.id },
        data: { status: ShortlistedStatus.HIRED },
      });

      return {
        success: true,
        message: 'Candidate hired successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to hire candidate for job: ${dto.job}`, error);
      throw new InternalServerErrorException('Failed to hire candidate');
    }
  }

  async unhireCandidate(companyId: string, dto: HireCandidateDto) {
    this.logger.log(
      `Unhiring candidate ${dto.candidate} for job: ${dto.job}, company: ${companyId}`,
    );

    try {
      // Parallel validation: verify job ownership and shortlist status
      const [job, shortlist] = await Promise.all([
        this.prisma.job.findFirst({
          where: { id: dto.job, companyId },
          select: { id: true },
        }),
        this.prisma.shortlisted.findFirst({
          where: { jobId: dto.job, playerId: dto.candidate },
          select: { id: true, status: true },
        }),
      ]);

      if (!job) {
        throw new BadRequestException('Job does not exist');
      }

      if (!shortlist) {
        throw new BadRequestException(
          'Candidate was not shortlisted for this job',
        );
      }

      if (shortlist.status !== ShortlistedStatus.HIRED) {
        throw new BadRequestException('Candidate is not hired for this job');
      }

      // Update shortlist status to NOT_HIRED
      await this.prisma.shortlisted.update({
        where: { id: shortlist.id },
        data: { status: ShortlistedStatus.NOT_HIRED },
      });

      return {
        success: true,
        message: 'Candidate unhired successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to unhire candidate for job: ${dto.job}`,
        error,
      );
      throw new InternalServerErrorException('Failed to unhire candidate');
    }
  }

  async getJobsWithHiredPlayers(companyId: string, q: GetHiredJobsQueryDto) {
    this.logger.log(
      `Fetching jobs with hired players for company: ${companyId}`,
    );

    try {
      const { page, take, skip } = createPaginationParams(q.page, q.limit);

      const where: Prisma.JobWhereInput = {
        companyId,
        status: JobStatus.ACTIVE,
        shortlisted: { some: {} },
      };

      if (q.search) {
        where.OR = [
          { title: { contains: q.search, mode: 'insensitive' } },
          { description: { contains: q.search, mode: 'insensitive' } },
          { type: { contains: q.search, mode: 'insensitive' } },
        ];
      }

      // Count + fetch minimal job data with shortlisted count
      const [total, jobs] = await Promise.all([
        this.prisma.job.count({ where }),
        this.prisma.job.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            status: true,
            location: true,
            createdAt: true,
            _count: { select: { shortlisted: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      // Fetch a small sample of latest avatars per job to avoid heavy includes
      const jobIds = jobs.map((j) => j.id);
      const shortlistedWithAvatars = jobIds.length
        ? await this.prisma.shortlisted.findMany({
            where: { jobId: { in: jobIds } },
            select: { jobId: true, player: { select: { avatar: true } } },
            orderBy: { createdAt: 'desc' },
            take: Math.min(jobIds.length * 12, 240),
          })
        : [];

      const avatarsByJob = new Map<string, string[]>();
      for (const s of shortlistedWithAvatars) {
        const avatar = s.player?.avatar;
        if (!avatar) continue;
        const list = avatarsByJob.get(s.jobId) ?? [];
        if (list.length < 12) list.push(avatar);
        avatarsByJob.set(s.jobId, list);
      }

      const transformedJobs = jobs.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status.toLowerCase(),
        hiredCount: job._count.shortlisted,
        hiredAvatars: avatarsByJob.get(job.id) ?? [],
      }));

      return {
        success: true,
        message: 'Jobs with hired players fetched successfully',
        data: {
          data: transformedJobs,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch jobs with hired players for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch jobs with hired players',
      );
    }
  }

  async getHiredPlayers(
    companyId: string,
    jobId: string,
    query: PaginationQueryDto,
  ) {
    this.logger.log(
      `Fetching hired players for job: ${jobId}, company: ${companyId}`,
    );

    try {
      const { page, take, skip } = createPaginationParams(
        query.page,
        query.limit,
      );

      // Verify job belongs to company
      const job = await this.prisma.job.findFirst({
        where: { id: jobId, companyId },
        select: { title: true },
      });

      if (!job) {
        throw new BadRequestException('Job does not exist');
      }

      // Build where clause with search functionality
      const where: any = { jobId };

      // if (query.search) {
      //   where.player = {
      //     user: {
      //       name: {
      //         contains: query.search,
      //         mode: 'insensitive'
      //       }
      //     }
      //   };
      // }

      const [players, total] = await Promise.all([
        this.prisma.shortlisted.findMany({
          where,
          include: {
            player: {
              select: {
                id: true,
                avatar: true,
                resume: true,
                user: { select: { name: true, userType: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.shortlisted.count({
          where: { jobId },
        }),
      ]);

      const formattedPlayers = players.map((p) => ({
        id: p.player.id,
        name: p.player.user.name,
        avatar: p.player.avatar,
        createdAt: p.createdAt.toISOString(),
        resume: p.player.resume,
        userType: p.player.user.userType.toLowerCase(),
      }));

      return {
        success: true,
        message: 'Hired players fetched successfully',
        data: {
          data: formattedPlayers,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch hired players for job: ${jobId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch hired players');
    }
  }

  async removeAllHiredUnderJob(companyId: string, jobId: string) {
    this.logger.log(
      `Unhiring all candidates for job: ${jobId}, company: ${companyId}`,
    );

    try {
      // Verify job belongs to company
      const job = await this.prisma.job.findFirst({
        where: { id: jobId, companyId },
        select: { id: true },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // Update all hired candidates to NOT_HIRED status
      const result = await this.prisma.shortlisted.updateMany({
        where: {
          jobId,
          status: ShortlistedStatus.HIRED,
        },
        data: {
          status: ShortlistedStatus.NOT_HIRED,
        },
      });

      return {
        success: true,
        message: 'All hired candidates unhired successfully',
        data: {
          unhiredCount: result.count,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to unhire all candidates for job: ${jobId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to unhire candidates');
    }
  }

  // Job Management Methods
  async getAllJobs(companyId: string, query: GetJobsQueryDto) {
    this.logger.log(`Fetching all jobs for company: ${companyId}`);

    try {
      const { page, take, skip } = createPaginationParams(
        query.page,
        query.limit,
      );
      const where: Prisma.JobWhereInput = { companyId };

      // Handle status filter from both status and status[] parameters
      const statusArray = query['status[]'] || query.status;

      // Handle status filter (only active and drafted)
      if (statusArray?.length) {
        const statusMap = {
          drafted: JobStatus.DRAFT,
          active: JobStatus.ACTIVE,
        };
        const mappedStatuses = statusArray
          .map((s) => statusMap[s.toLowerCase() as keyof typeof statusMap])
          .filter(Boolean);

        if (mappedStatuses.length) {
          where.status =
            mappedStatuses.length === 1
              ? mappedStatuses[0]
              : { in: mappedStatuses };
        }
      }

      // Handle search
      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { type: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // Handle date filter from both createdAt and createdAt[] parameters
      const createdAtArray = query['createdAt[]'] || query.createdAt;

      // Handle date filter
      if (createdAtArray?.length) {
        const [dateFrom, dateTo] = createdAtArray;
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      // Handle draftOrigin filter from both draftOrigin and draftOrigin[] parameters
      const draftOriginArray = query['draftOrigin[]'] || query.draftOrigin;

      // Handle draftOrigin filter
      if (draftOriginArray?.length) {
        where.draftOrigin =
          draftOriginArray.length === 1
            ? draftOriginArray[0]
            : { in: draftOriginArray };
      }

      // Handle draftedAt date filter from both draftedAt and draftedAt[] parameters
      const draftedAtArray = query['draftedAt[]'] || query.draftedAt;

      // Handle draftedAt date filter
      if (draftedAtArray?.length) {
        const [dateFrom, dateTo] = draftedAtArray;
        where.draftedAt = {};
        if (dateFrom) where.draftedAt.gte = new Date(dateFrom);
        if (dateTo) where.draftedAt.lte = new Date(dateTo);
      }

      const [total, jobs] = await Promise.all([
        this.prisma.job.count({ where }),
        this.prisma.job.findMany({
          where,
          select: {
            id: true,
            title: true,
            role: true,
            type: true,
            description: true,
            responsibilities: true,
            qualifications: true,
            skills: true,
            traits: true,
            tags: true,
            location: true,
            salary: true,
            startDate: true,
            endDate: true,
            openToAll: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      const formattedJobs = jobs.map((job) => ({
        id: job.id,
        title: job.title,
        role: job.role,
        type: mapEmploymentType(job.type),
        description: job.description,
        responsibilities: (job.responsibilities as string[]) || [],
        qualifications: (job.qualifications as string[]) || [],
        skills: job.skills || [],
        traits: (job.traits as string[]) || [],
        tags: job.tags as string[] | undefined,
        location: job.location,
        salary: {
          min: (job.salary as any)?.min || 0,
          max: (job.salary as any)?.max || 0,
          currency: (job.salary as any)?.currency || 'USD',
        },
        startDate: job.startDate?.toISOString() || new Date().toISOString(),
        endDate: job.endDate?.toISOString(),
        openToAll: job.openToAll || false,
        applicants: job._count.applications,
        status: job.status === JobStatus.DRAFT ? 'drafted' : 'active',
        draftOrigin:
          job.status === JobStatus.DRAFT
            ? ((job._count.applications > 0
                ? 'from_posted'
                : 'never_posted') as 'never_posted' | 'from_posted')
            : ('never_posted' as 'never_posted' | 'from_posted'),
        draftedAt:
          job.status === JobStatus.DRAFT
            ? (job.updatedAt || job.createdAt).toISOString()
            : job.createdAt.toISOString(),
        createdAt: job.createdAt.toISOString(),
      }));

      return {
        success: true,
        message: 'Jobs fetched successfully',
        data: {
          data: formattedJobs,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch jobs for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch jobs');
    }
  }

  async createJob(companyId: string, dto: CreateJobDto) {
    this.logger.log(`Creating job for company: ${companyId}`);

    try {
      // Status is already transformed to JobStatus enum by the DTO
      // Default to ACTIVE if not provided
      const jobStatus = dto.status ?? JobStatus.ACTIVE;

      await this.prisma.job.create({
        data: {
          companyId,
          title: dto.title,
          description: dto.description,
          role: dto.role,
          location: dto.location ?? '',
          type: dto.type ?? '',
          skills: dto.skills,
          tags: dto.tags ?? [],
          salary: dto.salary ? JSON.parse(JSON.stringify(dto.salary)) : {},
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          endDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1),
          ),
          openToAll: dto.openToAll ?? false,
          responsibilities:
            dto.responsibilities as unknown as Prisma.InputJsonValue,
          qualifications:
            dto.qualifications as unknown as Prisma.InputJsonValue,
          traits: (dto.traits ?? []) as unknown as Prisma.InputJsonValue,
          status: jobStatus,
        },
      });

      return {
        success: true,
        message: 'Job created successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create job for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to create job');
    }
  }

  async getJobById(companyId: string, jobId: string) {
    this.logger.log(`Fetching job ${jobId} for company: ${companyId}`);

    try {
      const job = await this.prisma.job.findFirst({
        where: { id: jobId, companyId },
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      return {
        success: true,
        message: 'Job fetched successfully',
        data: {
          id: job.id,
          title: job.title,
          role: job.role,
          description: job.description,
          type: mapEmploymentType(job.type),
          skills: job.skills || [],
          responsibilities: job.responsibilities || [],
          qualifications: job.qualifications || [],
          traits: job.traits || [],
          tags: job.tags || [],
          location: job.location,
          salary: job.salary,
          startDate: job.startDate?.toISOString() ?? undefined,
          openToAll: job.openToAll ?? false,
          applicants: job._count.applications,
          status: job.status.toLowerCase(),
          createdAt: job.createdAt.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch job ${jobId} for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch job');
    }
  }

  async updateJob(companyId: string, jobId: string, dto: UpdateJobDto) {
    this.logger.log(`Updating job ${jobId} for company: ${companyId}`);

    try {
      // If status is being updated, we need to fetch current job for status transition logic
      let currentJob: {
        id: string;
        companyId: string;
        status: JobStatus;
      } | null = null;
      if (dto.status !== undefined) {
        currentJob = await this.prisma.job.findUnique({
          where: { id: jobId },
          select: { id: true, companyId: true, status: true },
        });

        if (!currentJob) {
          throw new NotFoundException('Job not found');
        }

        if (currentJob.companyId !== companyId) {
          throw new NotFoundException('Job not found');
        }
      }

      // Build update data dynamically - only include fields that are provided
      const updateData: Prisma.JobUpdateInput = {};

      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.role !== undefined) updateData.role = dto.role;
      if (dto.type !== undefined) updateData.type = dto.type;
      if (dto.skills !== undefined) updateData.skills = dto.skills;
      if (dto.responsibilities !== undefined) {
        updateData.responsibilities =
          dto.responsibilities as unknown as Prisma.InputJsonValue;
      }
      if (dto.qualifications !== undefined) {
        updateData.qualifications =
          dto.qualifications as unknown as Prisma.InputJsonValue;
      }
      if (dto.traits !== undefined) {
        updateData.traits = dto.traits as unknown as Prisma.InputJsonValue;
      }
      if (dto.tags !== undefined) updateData.tags = dto.tags;
      if (dto.location !== undefined) updateData.location = dto.location;
      if (dto.salary !== undefined) {
        updateData.salary = dto.salary as unknown as Prisma.InputJsonValue;
      }
      if (dto.startDate !== undefined) {
        updateData.startDate = new Date(dto.startDate);
      }
      if (dto.openToAll !== undefined) updateData.openToAll = dto.openToAll;

      // Handle status updates with proper business logic
      if (dto.status !== undefined && currentJob) {
        updateData.status = dto.status;

        // Handle status-specific logic based on transitions
        if (dto.status === JobStatus.DRAFT) {
          // When moving to DRAFT, set draftOrigin based on previous status
          if (currentJob.status === JobStatus.ACTIVE) {
            updateData.draftOrigin = 'from_posted';
            updateData.draftedAt = new Date();
          } else if (currentJob.status === JobStatus.INACTIVE) {
            // Keep existing draftOrigin if moving from INACTIVE to DRAFT
            updateData.draftedAt = new Date();
          }
        } else if (dto.status === JobStatus.ACTIVE) {
          // When publishing, clear draft-related fields
          updateData.draftOrigin = null;
          updateData.draftedAt = null;
        }
      }

      // Check if there are any fields to update
      if (Object.keys(updateData).length === 0) {
        return {
          success: true,
          message: 'No changes detected',
        };
      }

      // Use update with compound where clause to verify ownership and update in one query
      await this.prisma.job.update({
        where: {
          id: jobId,
          companyId, // Ensures job belongs to company
        },
        data: updateData,
      });

      return {
        success: true,
        message: 'Job updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Job not found');
      }
      this.logger.error(
        `Failed to update job ${jobId} for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to update job');
    }
  }

  async deleteJob(companyId: string, jobId: string) {
    this.logger.log(`Deleting job ${jobId} for company: ${companyId}`);

    try {
      const existingJob = await this.prisma.job.findFirst({
        where: { id: jobId, companyId },
      });

      if (!existingJob) {
        throw new NotFoundException('Job not found');
      }

      // Delete related data
      await this.prisma.$transaction([
        this.prisma.shortlisted.deleteMany({ where: { jobId } }),
        this.prisma.application.deleteMany({ where: { jobId } }),
        this.prisma.job.delete({ where: { id: jobId } }),
      ]);

      return {
        success: true,
        message: 'Job deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete job ${jobId} for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to delete job');
    }
  }

  // Questionnaire (Partner)
  async getPartnerQuestions() {
    this.logger.log('Fetching partner questions from external webhook');
    try {
      const resp = await this.httpService.axiosRef.get(
        'https://webhook.mmsoft.com.br/webhook/partnerQuestions',
      );
      return {
        success: true,
        message: 'Questions fetched successfully',
        data: resp.data,
      };
    } catch (error) {
      this.logger.error('Failed to fetch partner questions', error);
      throw new InternalServerErrorException('Failed to fetch questions');
    }
  }

  async postPartnerAnswers(companyId: string, dto: PostPartnerAnswersDto) {
    this.logger.log(`Submitting partner answers for company: ${companyId}`);
    try {
      // Submit answers
      const submit = await this.httpService.axiosRef.post(
        'https://webhook.mmsoft.com.br/webhook/partnerAnswer',
        { partner_id: companyId, answers: dto.answers },
      );

      if (submit.status !== 200) {
        throw new InternalServerErrorException('Failed to submit answers');
      }

      // Poll for score (up to 30s)
      const poll = async () => {
        const maxRetries = 6;
        const delayMs = 5000;
        for (let i = 0; i < maxRetries; i++) {
          const resp = await this.httpService.axiosRef.get(
            'https://webhook.mmsoft.com.br/webhook/getRegisteredPartners',
          );
          const arr = Array.isArray(resp.data) ? resp.data : [];
          const found = arr.find(
            (p: any) => p.partner_id === companyId && p.summary_score,
          );
          if (found) return found;
          await new Promise((r) => setTimeout(r, delayMs));
        }
        return null;
      };

      const result = await poll();
      if (!result) {
        throw new RequestTimeoutException(
          'Could not retrieve test score in time. It will be updated in your profile later.',
        );
      }

      const { summary_score } = result;
      // Optionally persist to company profile here if schema supports it

      return {
        success: true,
        message: 'Submitted successfully',
        data: { score: summary_score },
      };
    } catch (error) {
      if (error instanceof RequestTimeoutException) {
        throw error;
      }
      this.logger.error('Failed to submit partner answers', error);
      throw new InternalServerErrorException('Failed to submit answers');
    }
  }

  async getPlayers(companyId: string, companyUserId: string, query: GetPlayersQueryDto) {
    this.logger.log(`Fetching players for company: ${companyId}`);

    try {
      const { page, take, skip } = createPaginationParams(
        query.page,
        query.limit,
      );

      // Define select fields for optimal performance
      const playerSelect = {
        id: true,
        avatar: true,
        about: true,
        sportsHistory: true,
        jobRole: true,
        shirtNumber: true,
        industry: true,
        workCountry: query.regions ? true : false,
        employmentType: query.workTypes ? true : false,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
          },
        },
        club: {
          select: {
            id: true,
            avatar: true,
            preferredColor: true,
            banner: true,
            category: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      };

      // Build where clause for players using Prisma filters
      const where: Prisma.PlayerWhereInput = {
        user: {
          affiliates: {
            some: {
              isApproved: true,
              type: {
                in:
                  query.candidates && query.candidates.length > 0
                    ? query.candidates.includes(UserType.SUPPORTER) &&
                      query.candidates.includes(UserType.PLAYER)
                      ? [UserType.PLAYER, UserType.SUPPORTER]
                      : query.candidates.includes(UserType.SUPPORTER)
                        ? [UserType.SUPPORTER]
                        : [UserType.PLAYER]
                    : [UserType.PLAYER, UserType.SUPPORTER],
              },
            },
          },
        },
      };

      // Search filter
      if (query.search) {
        where.OR = [
          { user: { name: { contains: query.search, mode: 'insensitive' } } },
          { about: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // Club filters
      if (query.clubs?.length) {
        where.clubId = { in: query.clubs };
      }

      if (query.clubTypes?.length) {
        where.club = {
          category: { in: query.clubTypes },
        };
      }

      // Fetch players with parallel count query
      let [players, total] = await Promise.all([
        this.prisma.player.findMany({
          where,
          select: playerSelect,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.player.count({ where }),
      ]);

      // Apply client-side region filtering if needed (for JSON array fields)
      if (query.regions?.length) {
        const regions = query.regions; // Type narrowing
        players = players.filter((player) => {
          if (!player.workCountry) return false;

          try {
            const workCountryArray = Array.isArray(player.workCountry)
              ? player.workCountry
              : JSON.parse(player.workCountry as string);

            if (!Array.isArray(workCountryArray)) return false;

            return regions.some((region) =>
              workCountryArray.some((country: string) =>
                country.toLowerCase().includes(region.toLowerCase()),
              ),
            );
          } catch (error) {
            this.logger.warn(
              `Failed to parse workCountry for player ${player.id}:`,
              error,
            );
            return false;
          }
        });
      }

      // Apply client-side workTypes (employmentType) filtering if needed (for JSON fields)
      if (query.workTypes?.length) {
        const workTypes = query.workTypes; // Type narrowing
        players = players.filter((player) => {
          if (!player.employmentType) return false;

          try {
            const employmentTypeObj =
              typeof player.employmentType === 'object'
                ? player.employmentType
                : JSON.parse(player.employmentType as string);

            // Check both primary and secondary employment types
            const allTypes: string[] = [];
            if (employmentTypeObj.primary) {
              allTypes.push(
                employmentTypeObj.primary.toLowerCase().replace(/_/g, '-'),
              );
            }
            if (Array.isArray(employmentTypeObj.secondary)) {
              allTypes.push(
                ...employmentTypeObj.secondary.map((type: string) =>
                  type.toLowerCase().replace(/_/g, '-'),
                ),
              );
            }

            return workTypes.some((queryType) =>
              allTypes.includes(queryType.toLowerCase()),
            );
          } catch (error) {
            this.logger.warn(
              `Failed to parse employmentType for player ${player.id}:`,
              error,
            );
            return false;
          }
        });
      }

      // Apply client-side industry filtering (checks against jobRole JSON field)
      if (query.industry?.length) {
        const industries = query.industry; // Type narrowing
        players = players.filter((player) => {
          if (!player.jobRole) return false;

          try {
            const jobRoleObj =
              typeof player.jobRole === 'object'
                ? player.jobRole
                : JSON.parse(player.jobRole as string);

            // Collect all roles (primary and secondary)
            const allRoles: string[] = [];
            if (jobRoleObj.primary) {
              allRoles.push(jobRoleObj.primary.toLowerCase());
            }
            if (Array.isArray(jobRoleObj.secondary)) {
              allRoles.push(
                ...jobRoleObj.secondary.map((role: string) =>
                  role.toLowerCase(),
                ),
              );
            }

            // Check if any industry matches any role
            return industries.some((queryIndustry) =>
              allRoles.some((role) =>
                role.includes(queryIndustry.toLowerCase()),
              ),
            );
          } catch (error) {
            this.logger.warn(
              `Failed to parse jobRole for player ${player.id}:`,
              error,
            );
            return false;
          }
        });
      }

      // Fetch existing chats between company and players for performance
      const playerUserIds = players.map((player) => player.user.id);
      const chats = await this.prisma.chat.findMany({
        where: {
          companyId: companyUserId,
          playerId: { in: playerUserIds },
        },
        select: {
          id: true,
          playerId: true,
        },
      });

      // Create a map for efficient lookup: playerUserId -> chatId
      const chatMap = new Map(
        chats.map((chat) => [chat.playerId, chat.id]),
      );

      // Format the response with only required fields
      const formattedPlayers = players.map((player) => {
        const chatId = chatMap.get(player.user.id) || null;

        return {
          id: player.id,
          userId: player.user.id,
          name: player.user.name,
          email: player.user.email,
          userType: player.user.userType.toLowerCase(),
          avatar: player.avatar,
          shirtNumber: player.shirtNumber,
          about: player.about,
          sportsHistory: player.sportsHistory,
          industry: player.industry,
          jobRole: player.jobRole,
          chatId,
          club: player.club
            ? {
                id: player.club.id,
                name: player.club.user?.name,
                avatar: player.club.avatar,
                preferredColor: player.club.preferredColor,
                banner: player.club.banner,
                category: player.club.category,
              }
            : undefined,
        };
      });

      return {
        success: true,
        message: 'Players retrieved successfully',
        data: {
          data: formattedPlayers,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch players for company: ${companyId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch players');
    }
  }

  private async trackCompanyView(playerId: string, companyId: string) {
    try {
      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (!player) return;

      // Use MongoDB's $pull and $push operators for atomic update
      await this.prisma.$runCommandRaw({
        update: 'players',
        updates: [
          {
            q: { _id: { $oid: playerId } },
            u: [
              {
                $set: {
                  recentlyViewedCompanies: {
                    $slice: [
                      {
                        $concatArrays: [
                          [companyId],
                          {
                            $filter: {
                              input: {
                                $ifNull: ['$recentlyViewedCompanies', []],
                              },
                              cond: { $ne: ['$$this', companyId] },
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
      this.logger.error('Failed to track company view:', error);
    }
  }
}
