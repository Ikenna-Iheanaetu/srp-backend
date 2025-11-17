import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClubItemDto } from './dto/responses/get-clubs-response.dto';
import {
  AffiliateStatus,
  AffiliateType,
  InvoiceStatus,
  JobStatus,
  OtpType,
  Prisma,
  ShortlistedStatus,
  UserStatus,
  UserType,
} from '@prisma/client';
import { GetClubsDto } from './dto/get-clubs.dto';
import { GetPublicClubsDto } from './dto/get-public-clubs.dto';
import { InviteClubDto } from './dto/invite-club.dto';
import {
  CodeGeneratorService,
  createPaginationMeta,
  createPaginationParams,
  MinioService,
  OtpUtilsService,
} from 'src/utils';
import { EmailService } from 'src/email/email.service';
import { CompleteProfileDto } from './dto/club-complete-profile.dto';
import { SecurityQuestionJson } from 'src/types/json-models/security-question.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { GetAffiliatesDto } from './dto/get-affiliates-query.dto';
import { CreateClubUpdateDto } from './dto/create-club-update.dto';
import { GetClubUpdatesDto } from './dto/get-club-updates.dto';
import { SaveAffiliateDto } from './dto/save-affiliate.dto';
import { GetSavedAffiliatesDto } from './dto/get-saved-affiliates.dto';

@Injectable()
export class ClubService {
  private readonly logger = new Logger(ClubService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGen: CodeGeneratorService,
    private readonly otpUtils: OtpUtilsService,
    private readonly emailService: EmailService,
    private readonly minio: MinioService,
  ) {}

  async getClubs(q: GetClubsDto) {
    const { page, take, skip } = createPaginationParams(q.page, q.limit);

    this.logger.log(`Fetching clubs page=${page} limit=${take}`);

    try {
      const baseWhere: Prisma.ClubWhereInput = {
        user: {
          name: q.search
            ? { contains: q.search, mode: 'insensitive' }
            : { not: null },
        },
      };

      const [total, clubs] = await Promise.all([
        this.prisma.club.count({ where: baseWhere }),
        this.prisma.club.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            avatar: true,
            refCode: true,
            user: {
              select: { name: true },
            },
            _count: {
              select: {
                affiliates: {
                  where: {
                    isApproved: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const rows = clubs.map((club) => ({
        id: club.id,
        name: club.user.name!,
        avatar: club.avatar,
        refCode: club.refCode,
        count: club._count.affiliates,
      }));

      this.logger.log(`Returned ${rows.length} clubs`);

      const meta = {
        total,
        totalPages: Math.ceil(total / take),
        page,
        limit: take,
      };

      return {
        success: true,
        message: 'Clubs fetched successfully',
        data: {
          data: rows,
          meta,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch clubs:', error);
      throw new InternalServerErrorException(
        'Failed to fetch clubs. Please try again later.',
      );
    }
  }

  async getPublicClubs(q: GetPublicClubsDto) {
    const page = Number(q.page ?? 1);
    const take = Number(q.limit ?? 10);
    const skip = (page - 1) * take;

    this.logger.log(
      `Fetching public clubs page=${page} limit=${take} search=${q.search || 'none'}`,
    );

    try {
      const baseWhere: Prisma.ClubWhereInput = {
        user: {
          name: q.search
            ? { contains: q.search, mode: 'insensitive' }
            : { not: null },
        },
      };

      const [total, clubs] = await Promise.all([
        this.prisma.club.count({ where: baseWhere }),
        this.prisma.club.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            avatar: true,
            refCode: true,
            user: {
              select: { name: true },
            },
          },
        }),
      ]);

      const rows = clubs.map((club) => ({
        id: club.id,
        name: club.user.name!,
        avatar: club.avatar,
        refCode: club.refCode,
      }));

      this.logger.log(`Returned ${rows.length} public clubs`);

      return {
        success: true,
        message: 'Clubs fetched successfully',
        data: {
          data: rows,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch public clubs:', error);
      throw new InternalServerErrorException(
        'Failed to fetch clubs. Please try again later.',
      );
    }
  }

  async getClubByRefCode(refCode: string) {
    this.logger.log(`Fetching club by refCode: ${refCode}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { refCode },
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

      if (!club || club.user.status !== UserStatus.ACTIVE) {
        throw new NotFoundException('Club not found');
      }

      return {
        success: true,
        message: 'Club fetched successfully',
        data: {
          id: club.id,
          name: club.user.name,
          avatar: club.avatar,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch club by refCode:', error);
      throw new InternalServerErrorException('Failed to fetch club');
    }
  }

  async inviteClubs(dto: InviteClubDto) {
    const { emails } = dto;
    this.logger.log(`Inviting clubs for ${emails.length} emails`);

    // Define a union type for results
    type InviteResult =
      | { status: 'processed'; email: string }
      | { status: 'skip'; email: string; reason: string };

    try {
      const processed: string[] = [];
      const skipped: { email: string; reason: string }[] = [];

      const [existingUsers, existingClubs] = await Promise.all([
        this.prisma.user.findMany({
          where: { email: { in: emails } },
          select: { email: true },
        }),
        this.prisma.club.findMany({
          where: { user: { email: { in: emails } } },
          select: { user: { select: { email: true } } },
        }),
      ]);

      const existingUserSet = new Set(existingUsers.map((u) => u.email));
      const existingClubSet = new Set(existingClubs.map((c) => c.user.email));

      const results = await Promise.allSettled<InviteResult>(
        emails.map(async (email): Promise<InviteResult> => {
          if (existingUserSet.has(email)) {
            return {
              status: 'skip',
              email,
              reason: 'A user with this email already exists.',
            };
          }

          if (existingClubSet.has(email)) {
            return {
              status: 'skip',
              email,
              reason: 'A club with this email already exists.',
            };
          }

          try {
            const refCode = this.codeGen.generateUniqueRefCode();

            const { user, club } = await this.prisma.$transaction(
              async (tx) => {
                const user = await tx.user.create({
                  data: {
                    email,
                    userType: UserType.CLUB,
                    status: UserStatus.PENDING,
                  },
                  select: { id: true, email: true },
                });

                const club = await tx.club.create({
                  data: {
                    userId: user.id,
                    refCode,
                    onboardingSteps: [1, 2],
                  },
                  select: { id: true, refCode: true },
                });

                return { user, club };
              },
            );

            // Generate OTP for this club invite
            const otp = await this.otpUtils.generateAndSaveOtp(
              email,
              OtpType.CLUB_INVITE,
              undefined,
              user.id,
            );

            // Send invite email
            await this.emailService.sendClubInviteEmail(
              email,
              club.refCode,
              otp,
            );

            return { status: 'processed', email };
          } catch (err) {
            this.logger.error(
              `Failed to create club invite for ${email}:`,
              err,
            );
            return {
              status: 'skip',
              email,
              reason: 'System error while creating club invite',
            };
          }
        }),
      );

      // Collect results
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value.status === 'processed') {
            processed.push(r.value.email);
          } else if (r.value.status === 'skip') {
            skipped.push({ email: r.value.email, reason: r.value.reason });
          }
        } else {
          this.logger.error('Unhandled error in club invite:', r.reason);
        }
      }

      this.logger.log(
        `Processed ${processed.length}, skipped ${skipped.length}`,
      );

      return {
        success: true,
        message: 'Club invitations processed',
        data: { processedEmails: processed, skippedEmails: skipped },
      };
    } catch (error) {
      this.logger.error('Failed to process club invitations:', error);
      throw new InternalServerErrorException(
        'Failed to process club invitations. Please try again later.',
      );
    }
  }

  async deleteClub(clubId: string) {
    this.logger.log(`Deleting club: ${clubId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { id: clubId },
        select: { id: true, userId: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      await this.prisma.$transaction(async (tx) => {
        await Promise.all([
          tx.clubUpdate.deleteMany({ where: { clubId } }),
          tx.affiliate.deleteMany({ where: { clubId } }),
          tx.notification.deleteMany({ where: { userId: club.userId } }),
          tx.player.updateMany({
            where: { clubId },
            data: { clubId: null },
          }),
        ]);

        await tx.user.delete({ where: { id: club.userId } });
      });

      this.logger.log(`Successfully deleted club: ${clubId}`);

      return {
        success: true,
        message: 'Club and all related data deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to delete club ${clubId}:`, error);
      throw new InternalServerErrorException(
        'Failed to delete club. Please try again later.',
      );
    }
  }

  async getClubHiredPlayers(
    clubId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    this.logger.log(`Fetching hired players for club: ${clubId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { id: clubId },
        include: { user: { select: { name: true } } },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const affiliates = await this.prisma.affiliate.findMany({
        where: { clubId, type: AffiliateType.COMPANY, isApproved: true },
        select: { userId: true },
      });

      const emptyResponse = {
        success: true,
        message: 'Fetched hired players successfully',
        data: {
          data: [],
          ...createPaginationMeta(0, page, limit),
        }
      };

      if (affiliates.length === 0) {
        return emptyResponse;
      }

      const companyUserIds = affiliates
        .map((a) => a.userId)
        .filter((a): a is string => Boolean(a));

      const companies = await this.prisma.company.findMany({
        where: { userId: { in: companyUserIds } },
        select: { id: true },
      });

      const companyIds = companies.map((c) => c.id);

      const jobs = await this.prisma.job.findMany({
        where: { companyId: { in: companyIds }, status: JobStatus.ACTIVE },
        select: { id: true },
      });

      const jobIds = jobs.map((job) => job.id);

      if (jobIds.length === 0) {
        return emptyResponse;
      }

      const [shortlisted, total] = await Promise.all([
        this.prisma.shortlisted.findMany({
          //TODO:: Create an enum for the shortlisted status
          where: { jobId: { in: jobIds }, status: ShortlistedStatus.HIRED },
          include: {
            player: {
              include: { user: { select: { name: true, userType: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.shortlisted.count({
          where: { jobId: { in: jobIds }, status: ShortlistedStatus.HIRED },
        }),
      ]);

      const formattedPlayers = shortlisted.map((s) => ({
        id: s.player.id,
        name: s.player.user.name,
        affiliateType: s.player.user.userType.toLowerCase(),
      }));

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

      this.logger.error(`Failed to fetch club hired players:`, error);
      throw new InternalServerErrorException('Failed to fetch hired players');
    }
  }

  async completeProfile(
    userId: string,
    dto: CompleteProfileDto,
    files?: { avatar?: Express.Multer.File; banner?: Express.Multer.File },
  ) {
    this.logger.log(`Completing profile step ${dto.step} for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true, onboardingSteps: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const onboardingSteps = club.onboardingSteps as number[];

      if (!onboardingSteps.includes(dto.step)) {
        throw new BadRequestException(
          `Step ${dto.step} has already been completed`,
        );
      }

      const updateData: Prisma.ClubUpdateInput = {};

      switch (dto.step) {
        case 1:
          await this.handleStep1(dto, updateData);
          break;
        case 2:
          await this.handleStep2(dto, files, updateData, userId);
          break;
      }

      const updatedClub = await this.prisma.club.update({
        where: { userId },
        data: {
          ...updateData,
          onboardingSteps: onboardingSteps.filter((step) => step !== dto.step),
        },
      });

      const remainingSteps = updatedClub.onboardingSteps as number[];

      return {
        success: true,
        message: `Club onboarding step ${dto.step} successfully`,
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
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      this.logger.error('Failed to complete profile:', error);
      throw new InternalServerErrorException('Failed to update club profile');
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    files?: { avatar?: Express.Multer.File; banner?: Express.Multer.File },
  ) {
    this.logger.log(`Updating profile for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const updateData = this.buildUpdateDataForProfile(dto);

      // Handle file uploads in parallel if present
      const uploadPromises = this.handleFileUploads(files, userId);
      const uploadResults = await Promise.all(uploadPromises);

      // Add file results to update data
      uploadResults.forEach((result) => {
        if (result) {
          updateData[result.field] = result.s3Key;
        }
      });

      // Check if there are any changes to make
      if (
        Object.keys(updateData).length === 0 &&
        !files?.avatar &&
        !files?.banner
      ) {
        return {
          success: true,
          message: 'No changes detected',
        };
      }

      // Use transaction for consistency
      await this.prisma.$transaction(async (tx) => {
        // Update user name if provided
        if (dto.name !== undefined) {
          await tx.user.update({
            where: { id: userId },
            data: { name: dto.name },
          });
        }

        // Update club data
        await tx.club.update({
          where: { userId },
          data: updateData,
        });
      });

      return {
        success: true,
        message: 'Club profile updated successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('Failed to update club profile:', error);
      throw new InternalServerErrorException('Failed to update club profile');
    }
  }

  async getDashboard(userId: string, query: any = {}) {
    this.logger.log(`Fetching dashboard for club: ${userId} with period: ${query.period || 'last_week'}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const period = query.period || 'last_week';
      
      // Calculate date range based on period
      const now = new Date();
      let dateRange: { start: Date; end: Date };
      
      switch (period) {
        case 'today':
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
          };
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          dateRange = {
            start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59),
          };
          break;
        case 'last_week':
          const lastWeek = new Date(now);
          lastWeek.setDate(lastWeek.getDate() - 7);
          dateRange = {
            start: lastWeek,
            end: now,
          };
          break;
        case 'last_month':
          const lastMonth = new Date(now);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          dateRange = {
            start: lastMonth,
            end: now,
          };
          break;
        case 'last_year':
          const lastYear = new Date(now);
          lastYear.setFullYear(lastYear.getFullYear() - 1);
          dateRange = {
            start: lastYear,
            end: now,
          };
          break;
        default:
          const defaultWeek = new Date(now);
          defaultWeek.setDate(defaultWeek.getDate() - 7);
          dateRange = {
            start: defaultWeek,
            end: now,
          };
      }

      // Use Promise.all for independent counts and revenue calculations with date filtering
      const [playersCount, companiesCount, hiredCount, revenueData, previousPeriodData] =
        await Promise.all([
          // Current period counts
          this.prisma.affiliate.count({
            where: {
              clubId: club.id,
              type: { in: [AffiliateType.PLAYER, AffiliateType.SUPPORTER] },
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
          }),
          this.prisma.affiliate.count({
            where: {
              clubId: club.id,
              type: AffiliateType.COMPANY,
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
          }),
          this.prisma.shortlisted.count({
            where: {
              status: ShortlistedStatus.HIRED,
              hiredAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
              job: {
                company: {
                  user: {
                    affiliates: {
                      some: {
                        clubId: club.id,
                        type: AffiliateType.COMPANY,
                        isApproved: true,
                      },
                    },
                  },
                },
                status: JobStatus.ACTIVE,
              },
            },
          }),
          // Calculate revenue from invoices associated with this club for the period
          this.prisma.invoice.aggregate({
            where: {
              clubId: club.id,
              status: InvoiceStatus.PAID,
              paidAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            _sum: {
              amount: true,
            },
          }),
          // Calculate previous period data for comparison
          this.calculatePreviousPeriodData(club.id, dateRange, period),
        ]);

      // Calculate total revenue (all paid invoices for the period)
      const totalRevenue = revenueData._sum.amount || 0;

      // For now, assuming paidOut is 40% of total revenue
      // In a real scenario, you'd track actual payouts in a separate model
      const paidOut = Math.round(totalRevenue * 0.4);

      // Calculate percentage changes
      const playersChange = this.calculatePercentageChange(previousPeriodData.playersCount, playersCount);
      const companiesChange = this.calculatePercentageChange(previousPeriodData.companiesCount, companiesCount);
      const hiredChange = this.calculatePercentageChange(previousPeriodData.hiredCount, hiredCount);

      this.logger.log(`Dashboard data - Revenue: ${totalRevenue}, PaidOut: ${paidOut}, Players: ${playersCount}, Companies: ${companiesCount}, Hired: ${hiredCount}`);

      return {
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          revenue: totalRevenue,
          paidOut: paidOut,
          metrics: [
            {
              title: 'Total Players',
              count: playersCount,
              percentageChange: playersChange,
              trendDirection: playersChange >= 0 ? 'up' as const : 'down' as const,
            },
            {
              title: 'Hired Players',
              count: hiredCount,
              percentageChange: hiredChange,
              trendDirection: hiredChange >= 0 ? 'up' as const : 'down' as const,
            },
            {
              title: 'Total Partners',
              count: companiesCount,
              percentageChange: companiesChange,
              trendDirection: companiesChange >= 0 ? 'up' as const : 'down' as const,
            },
          ],
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to fetch dashboard data:', error);
      throw new InternalServerErrorException('Failed to fetch dashboard data');
    }
  }

  private calculatePreviousPeriodData(clubId: string, currentRange: { start: Date; end: Date }, period: string) {
    const periodLength = currentRange.end.getTime() - currentRange.start.getTime();
    const previousStart = new Date(currentRange.start.getTime() - periodLength);
    const previousEnd = new Date(currentRange.start.getTime() - 1);

    return Promise.all([
      this.prisma.affiliate.count({
        where: {
          clubId,
          type: { in: [AffiliateType.PLAYER, AffiliateType.SUPPORTER] },
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      }),
      this.prisma.affiliate.count({
        where: {
          clubId,
          type: AffiliateType.COMPANY,
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      }),
      this.prisma.shortlisted.count({
        where: {
          status: ShortlistedStatus.HIRED,
          hiredAt: {
            gte: previousStart,
            lte: previousEnd,
          },
          job: {
            company: {
              user: {
                affiliates: {
                  some: {
                    clubId,
                    type: AffiliateType.COMPANY,
                    isApproved: true,
                  },
                },
              },
            },
            status: JobStatus.ACTIVE,
          },
        },
      }),
    ]).then(([playersCount, companiesCount, hiredCount]) => ({
      playersCount,
      companiesCount,
      hiredCount,
    }));
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }

  async getProfile(userId: string) {
    this.logger.log(`Fetching profile for club: ${userId}`);

    try {
      // Fetch club and affiliate data in parallel
      const [club, affiliate] = await Promise.all([
        this.prisma.club.findUnique({
          where: { userId },
          include: {
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
          where: { userId },
          select: { isApproved: true },
        }),
      ]);

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      return {
        success: true,
        message: 'Club profile fetched successfully',
        data: {
          id: club.id,
          name: club.user.name || '',
          email: club.user.email,
          userType: club.user.userType.toLowerCase(),
          onboardingSteps: club.onboardingSteps || [],
          about: club.about,
          avatar: club.avatar,
          banner: club.banner,
          tagline: club.tagline,
          category: club.category,
          address: club.address,
          country: club.country,
          region: club.region,
          website: club.website,
          phone: club.phone,
          focus: club.focus,
          status: club.user.status.toLowerCase(),
          founded: club.founded,
          refCode: club.refCode,
          sponsorshipOpportunities: club.sponsorshipOpportunities || [],
          sponsorshipPrograms: club.sponsorshipPrograms || [],
          socials: club.socials,
          preferredColor: club.preferredColor,
          isApproved: true,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to fetch club profile:', error);
      throw new InternalServerErrorException('Failed to fetch club profile');
    }
  }

  async getPublicClubProfile(id: string) {
    this.logger.log(`Fetching public club profile: ${id}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { id },
        select: {
          id: true,
          about: true,
          avatar: true,
          banner: true,
          tagline: true,
          category: true,
          address: true,
          country: true,
          region: true,
          phone: true,
          focus: true,
          founded: true,
          refCode: true,
          preferredColor: true,
          sponsorshipOpportunities: true,
          sponsorshipPrograms: true,
          socials: true,
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

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      return {
        success: true,
        message: 'Club profile fetched successfully',
        data: {
          userId: club.id,
          name: club.user.name || '',
          email: club.user.email,
          userType: club.user.userType.toLowerCase(),
          about: club.about,
          avatar: club.avatar,
          banner: club.banner,
          tagline: club.tagline,
          category: club.category,
          address: club.address,
          country: club.country,
          region: club.region,
          phone: club.phone,
          focus: club.focus,
          status: club.user.status.toLowerCase(),
          founded: club.founded,
          refCode: club.refCode,
          sponsorshipOpportunities: club.sponsorshipOpportunities || [],
          sponsorshipPrograms: club.sponsorshipPrograms || [],
          socials: {
            facebook: (club.socials as any)?.facebook || '',
            instagram: (club.socials as any)?.instagram || '',
            twitter: (club.socials as any)?.twitter || '',
          },
          preferredColor: club.preferredColor,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to fetch public club profile:', error);
      throw new InternalServerErrorException(
        'Failed to fetch public club profile',
      );
    }
  }

  async createAffiliate(userId: string, dto: CreateAffiliateDto) {
    this.logger.log(`Creating affiliate for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        include: { user: { select: { name: true } } },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      // Bulk check for existing users and invites
      const [existingUsers, existingInvites] = await Promise.all([
        this.prisma.user.findMany({
          where: { email: { in: dto.emails } },
          select: { email: true },
        }),
        this.prisma.affiliate.findMany({
          where: { email: { in: dto.emails }, clubId: club.id },
          select: { email: true },
        }),
      ]);

      const existingUserEmails = new Set(existingUsers.map((u) => u.email));
      const existingInviteEmails = new Set(existingInvites.map((i) => i.email));

      const processed: string[] = [];
      const skipped: Array<{ email: string; reason: string }> = [];
      const validEmails: string[] = [];

      // Filter valid emails
      for (const email of dto.emails) {
        if (existingUserEmails.has(email)) {
          skipped.push({
            email,
            reason: 'An account with this email already exists.',
          });
        } else if (existingInviteEmails.has(email)) {
          skipped.push({
            email,
            reason: 'An invitation has already been sent to this email.',
          });
        } else {
          validEmails.push(email);
        }
      }

      // Process valid emails
      if (validEmails.length > 0) {
        const affiliateData = validEmails.map((email) => ({
          type: dto.type,
          email,
          clubId: club.id,
          status: AffiliateStatus.PENDING,
          refCode: club.refCode,
          isApproved: false,
        }));

        const createdAffiliates = await this.prisma.affiliate.createMany({
          data: affiliateData,
        });

        // Send emails asynchronously (non-blocking)
        this.sendAffiliateInviteEmailsAsync(
          validEmails,
          dto.type,
          club.user.name || 'Club',
          club.refCode || '',
        );
        processed.push(...validEmails);
      }

      return {
        success: true,
        message: 'Affiliate requests sent successfully',
        data: {
          processedEmails: processed,
          skippedEmails: skipped,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to create affiliate:', error);
      throw new InternalServerErrorException('Failed to create affiliate');
    }
  }

  async getAffiliates(userId: string, query: GetAffiliatesDto) {
    this.logger.log(`Fetching affiliates for club: ${userId}`);

    try {
      const { skip, take, page } = createPaginationParams(
        query.page,
        query.limit,
      );
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const where: Prisma.AffiliateWhereInput = {
        clubId: club.id,
        isApproved: true,
      };

      if (query.affiliateTypes?.length) {
        where.type = { in: query.affiliateTypes };
      }

      if (query.status?.length) {
        where.status = { in: query.status };
      }

      if (query.search?.trim()) {
        where.OR = [
          {
            email: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            user: {
              name: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          },
        ];
      }

      const [total, affiliates, savedAffiliates] = await Promise.all([
        this.prisma.affiliate.count({ where }),
        this.prisma.affiliate.findMany({
          where,
          select: {
            id: true,
            clubId: true,
            email: true,
            purpose: true,
            status: true,
            isApproved: true,
            refCode: true,
            byAdmin: true,
            createdAt: true,
            updatedAt: true,
            type: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true,
                company: {
                  select: {
                    id: true,
                    about: true,
                    avatar: true,
                    secondaryAvatar: true,
                    banner: true,
                    tagline: true,
                    address: true,
                    country: true,
                    phone: true,
                    focus: true,
                    industry: true,
                    isQuestionnaireTaken: true,
                  },
                },
                player: {
                  select: {
                    id: true,
                    about: true,
                    avatar: true,
                    address: true,
                    phone: true,
                    industry: true,
                    shirtNumber: true,
                    birthYear: true,
                    sportsHistory: true,
                    isQuestionnaireTaken: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.savedAffiliate.findMany({
          where: { clubId: club.id },
          select: { userId: true },
        }),
      ]);

      const savedIds = new Set(savedAffiliates.map((sa) => sa.userId));

      const formattedAffiliates = affiliates.map((affiliate) => {
        const userDetails =
          affiliate.user?.company || affiliate.user?.player || null;

        const baseAffiliate = {
          id: affiliate.id,
          club: affiliate.clubId,
          email: affiliate.email,
          purpose: affiliate.purpose,
          status: affiliate.status.toLowerCase(),
          isApproved: affiliate.isApproved,
          refCode: affiliate.refCode,
          byAdmin: affiliate.byAdmin,
          createdAt: affiliate.createdAt,
          updatedAt: affiliate.updatedAt,
          isSaved: affiliate.user?.id ? savedIds.has(affiliate.user.id) : false,
        };

        if (!userDetails) {
          return {
            ...baseAffiliate,
            userData: {
              name: affiliate.user?.name || '',
              id: affiliate.user?.id || '',
              userId: affiliate.user?.id,
              email: affiliate.user?.email,
              userType: affiliate.user?.userType.toLowerCase(),
              club: affiliate.clubId,
            },
          };
        }

        // Build userData based on type (company or player)
        if (affiliate.user?.company) {
          return {
            ...baseAffiliate,
            userData: {
              name: affiliate.user?.name || '',
              id: userDetails.id,
              userId: affiliate.user?.id,
              email: affiliate.user?.email,
              userType: affiliate.user?.userType.toLowerCase(),
              about: userDetails.about,
              avatar: userDetails.avatar,
              secondaryAvatar: (userDetails as any).secondaryAvatar,
              banner: (userDetails as any).banner,
              tagline: (userDetails as any).tagline,
              address: userDetails.address,
              country: (userDetails as any).country,
              phone: userDetails.phone,
              focus: (userDetails as any).focus,
              industry: userDetails.industry,
              isQuestionnaireTaken: userDetails.isQuestionnaireTaken || false,
              club: affiliate.clubId,
            },
          };
        }

        // Player/Supporter data
        return {
          ...baseAffiliate,
          userData: {
            name: affiliate.user?.name || '',
            id: userDetails.id,
            userId: affiliate.user?.id,
            email: affiliate.user?.email,
            userType: affiliate.user?.userType.toLowerCase(),
            about: userDetails.about,
            avatar: userDetails.avatar,
            address: userDetails.address,
            phone: userDetails.phone,
            industry: userDetails.industry,
            shirtNumber: (userDetails as any).shirtNumber,
            birthYear: (userDetails as any).birthYear,
            sportsHistory: (userDetails as any).sportsHistory,
            isQuestionnaireTaken: userDetails.isQuestionnaireTaken || false,
            club: affiliate.clubId,
          },
        };
      });

      return {
        success: true,
        message: 'Affiliates fetched successfully',
        data: {
          data: formattedAffiliates,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to fetch affiliates:', error);
      throw new InternalServerErrorException('Failed to fetch affiliates');
    }
  }

  async declineAffiliate(userId: string, affiliateId: string) {
    this.logger.log(`Declining affiliate: ${affiliateId} for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const affiliate = await this.prisma.affiliate.findFirst({
        where: { id: affiliateId, clubId: club.id },
      });

      if (!affiliate) {
        throw new NotFoundException('Affiliate not found');
      }

      await this.prisma.affiliate.delete({
        where: { id: affiliateId },
      });

      // Send decline email
      await this.emailService.declineAffiliateInviteEmail(affiliate.email);

      return {
        success: true,
        message: 'Affiliate declined successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to decline affiliate:', error);
      throw new InternalServerErrorException('Failed to decline affiliate');
    }
  }

  async createClubUpdate(userId: string, dto: CreateClubUpdateDto) {
    this.logger.log(`Creating club update for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        include: { user: { select: { name: true } } },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      // Fetch affiliates outside transaction for email sending
      const affiliates = await this.prisma.affiliate.findMany({
        where: { clubId: club.id },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      });

      // Keep transaction short - only data writes
      const result = await this.prisma.$transaction(async (tx) => {
        const clubUpdate = await tx.clubUpdate.create({
          data: {
            clubId: club.id,
            message: dto.message,
          },
        });

        // Create notifications for affiliates with skipDuplicates
        const notifications = affiliates
          .filter((affiliate) => affiliate.user)
          .map((affiliate) => ({
            userId: affiliate.user!.id,
            title: 'New club update',
            message: 'A new update has been posted by your club.',
            type: 'SYSTEM' as const,
          }));

        if (notifications.length > 0) {
          await tx.notification.createMany({
            data: notifications,
          });
        }

        return { clubUpdate };
      });

      // Send email notifications asynchronously (non-blocking)
      this.sendClubUpdateEmailsAsync(
        affiliates,
        club.user.name || 'Club',
        dto.message,
      );

      return {
        success: true,
        message: 'Club update created successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to create club update:', error);
      throw new InternalServerErrorException('Failed to create club update');
    }
  }

  async getClubUpdates(userId: string, query: GetClubUpdatesDto) {
    this.logger.log(`Fetching club updates for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const { skip, take, page } = createPaginationParams(
        query.page,
        query.limit,
      );

      const [total, updates] = await Promise.all([
        this.prisma.clubUpdate.count({
          where: { clubId: club.id },
        }),
        this.prisma.clubUpdate.findMany({
          where: { clubId: club.id },
          select: {
            id: true,
            clubId: true,
            message: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      return {
        success: true,
        message: 'Club updates fetched successfully',
        data: updates,
        ...createPaginationMeta(total, page, take),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to fetch club updates:', error);
      throw new InternalServerErrorException('Failed to fetch club updates');
    }
  }

  async saveAffiliate(userId: string, dto: SaveAffiliateDto) {
    this.logger.log(`Saving affiliate: ${dto.userId} for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const affiliate = await this.prisma.affiliate.findFirst({
        where: {
          clubId: club.id,
          userId: dto.userId,
        },
        select: { id: true },
      });

      if (!affiliate) {
        throw new NotFoundException('User is not affiliated with this club');
      }

      const existingSave = await this.prisma.savedAffiliate.findUnique({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: dto.userId,
          },
        },
      });

      let action: string;
      const capitalizedRole =
        dto.role.charAt(0).toUpperCase() + dto.role.slice(1);

      if (existingSave) {
        await this.prisma.savedAffiliate.delete({
          where: { id: existingSave.id },
        });
        action = 'removed';
      } else {
        await this.prisma.savedAffiliate.create({
          data: {
            clubId: club.id,
            userId: dto.userId,
            role: dto.role,
          },
        });
        action = 'saved';
      }

      return {
        success: true,
        message: `${capitalizedRole} ${action} successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to save affiliate:', error);
      throw new InternalServerErrorException('Failed to save affiliate');
    }
  }

  async getSavedAffiliates(userId: string, query: GetSavedAffiliatesDto) {
    this.logger.log(`Fetching saved affiliates for club: ${userId}`);

    try {
      const { skip, take, page } = createPaginationParams(
        query.page,
        query.limit,
      );

      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const where: Prisma.SavedAffiliateWhereInput = {
        clubId: club.id,
      };

      // Filter by affiliate type if provided
      if (query.affiliateTypes?.length) {
        where.user = {
          userType: { in: query.affiliateTypes },
        };
      }

      const [total, savedAffiliates] = await Promise.all([
        this.prisma.savedAffiliate.count({ where }),
        this.prisma.savedAffiliate.findMany({
          where,
          select: {
            id: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true,
                status: true,
                company: {
                  select: {
                    id: true,
                    about: true,
                    avatar: true,
                    secondaryAvatar: true,
                    banner: true,
                    tagline: true,
                    address: true,
                    country: true,
                    phone: true,
                    focus: true,
                    industry: true,
                    region: true,
                    availability: true,
                    score: true,
                    preferredClubs: true,
                    isQuestionnaireTaken: true,
                  },
                },
                player: {
                  select: {
                    id: true,
                    about: true,
                    avatar: true,
                    address: true,
                    phone: true,
                    industry: true,
                    workCountry: true,
                    traits: true,
                    skills: true,
                    shirtNumber: true,
                    birthYear: true,
                    sportsHistory: true,
                    isQuestionnaireTaken: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      const formattedAffiliates = savedAffiliates.map((saved) => {
        const { user } = saved;
        const isCompany = user.userType === 'COMPANY';
        const isPlayer = user.userType === 'PLAYER';

        // Base data structure
        const baseData = {
          id: isCompany ? user.company!.id : user.player!.id,
          userId: user.id,
          name: user.name || '',
          email: user.email,
          userType: user.userType.toLowerCase(),
          status: user.status.toLowerCase(),
        };

        // Company-specific data
        if (isCompany && user.company) {
          return {
            ...baseData,
            about: user.company.about,
            avatar: user.company.avatar,
            secondaryAvatar: user.company.secondaryAvatar,
            address: user.company.address,
            region: user.company.region as any,
            tagline: user.company.tagline,
            industry: user.company.industry,
            focus: user.company.focus,
            preferredClubs: user.company.preferredClubs,
            score: user.company.score,
            country: user.company.country,
            availability: user.company.availability,
            // Note: club field is omitted as per SavedAffiliatesApiResponseData type
          };
        }

        // Player-specific data
        if (isPlayer && user.player) {
          return {
            ...baseData,
            about: user.player.about,
            avatar: user.player.avatar,
            address: user.player.address,
            workLocations: (user.player.workCountry as string[]) || [],
            traits: (user.player.traits as string[]) || [],
            skills: (user.player.skills as string[]) || [],
            shirtNumber: user.player.shirtNumber,
            birthYear: user.player.birthYear,
            sportsHistory: user.player.sportsHistory,
            // Note: club field is omitted as per SavedAffiliatesApiResponseData type
          };
        }

        // Fallback for users without profiles (shouldn't happen, but safety)
        return baseData;
      });

      return {
        success: true,
        message: 'Saved affiliates fetched successfully',
        data: {
          data: formattedAffiliates,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to fetch saved affiliates:', error);
      throw new InternalServerErrorException(
        'Failed to fetch saved affiliates',
      );
    }
  }

  /**
   * Private methods
   */

  private buildUpdateDataForProfile(dto: UpdateProfileDto) {
    const updateData: Record<string, any> = {};

    // Simple fields
    const simpleFields = [
      'category',
      'about',
      'phone',
      'preferredColor',
      'focus',
      'website',
      'region',
    ];

    simpleFields.forEach((field) => {
      if (dto[field] !== undefined) {
        updateData[field] = dto[field];
      }
    });

    // Handle address
    if (dto.address !== undefined) {
      if (dto.address.street || dto.address.city || dto.address.postalCode) {
        updateData.address = dto.address as any;
      } else {
        throw new BadRequestException(
          'Address must contain at least one of: street, city, postalCode',
        );
      }
    }

    // Handle socials
    if (dto.socials !== undefined) {
      updateData.socials = dto.socials as any;
    }

    return updateData;
  }

  private handleFileUploads(
    files?: { avatar?: Express.Multer.File; banner?: Express.Multer.File },
    userId?: string,
  ): Promise<{ field: string; s3Key: string } | null>[] {
    const uploadPromises: Promise<{ field: string; s3Key: string } | null>[] =
      [];

    if (!files) return uploadPromises;

    if (files.avatar) {
      uploadPromises.push(
        this.minio
          .uploadFile(files.avatar, userId!, 'avatar')
          .then((result) => ({ field: 'avatar', s3Key: result.publicUrl }))
          .catch((error) => {
            this.logger.error('Failed to upload avatar:', error);
            return null;
          }),
      );
    }

    if (files.banner) {
      uploadPromises.push(
        this.minio
          .uploadFile(files.banner, userId!, 'banner')
          .then((result) => ({ field: 'banner', s3Key: result.publicUrl }))
          .catch((error) => {
            this.logger.error('Failed to upload banner:', error);
            return null;
          }),
      );
    }

    return uploadPromises;
  }

  private async handleStep1(
    dto: CompleteProfileDto,
    updateData: Prisma.ClubUpdateInput,
  ) {
    try {
      if (dto.category) updateData.category = dto.category;
      if (dto.about) updateData.about = dto.about;
      if (dto.phone) updateData.phone = dto.phone;
      if (dto.preferredColor) updateData.preferredColor = dto.preferredColor;

      // Handle region
      if (dto.region !== undefined) {
        updateData.region = dto.region;
      }

      // Handle address
      if (dto.address !== undefined) {
        this.logger.log(
          'Address object:',
          JSON.stringify(dto.address, null, 2),
        );
        this.logger.log('Address keys:', Object.keys(dto.address));
        this.logger.log('Street value:', dto.address.street);

        if (dto.address.street || dto.address.city || dto.address.postalCode) {
          updateData.address = dto.address as any;
        } else {
          throw new BadRequestException(
            'Address must contain at least one of: street, city, postalCode',
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in step 1 processing:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to process step 1 data');
    }
  }

  private async handleStep2(
    dto: CompleteProfileDto,
    files:
      | { avatar?: Express.Multer.File; banner?: Express.Multer.File }
      | undefined,
    updateData: Prisma.ClubUpdateInput,
    userId: string,
  ) {
    try {
      // Handle file uploads
      if (files?.avatar) {
        const { publicUrl } = await this.minio.uploadFile(
          files.avatar,
          userId,
          'avatar',
        );
        updateData.avatar = publicUrl;
      }

      if (files?.banner) {
        const { publicUrl } = await this.minio.uploadFile(
          files.banner,
          userId,
          'banner',
        );
        updateData.banner = publicUrl;
      }

      if (dto.focus) updateData.focus = dto.focus;
      if (dto.website) updateData.website = dto.website;

      // Handle socials
      if (dto.socials !== undefined) {
        updateData.socials = dto.socials as any;
      }
    } catch (error) {
      this.logger.error('Error in step 2 processing:', error);
      if (error.message?.includes('upload')) {
        throw new InternalServerErrorException('File upload failed');
      }
      throw new InternalServerErrorException('Failed to process step 2 data');
    }
  }

  private async sendAffiliateInviteEmailsAsync(
    emails: string[],
    type: AffiliateType,
    clubName: string,
    refCode: string,
  ): Promise<void> {
    if (emails.length === 0) return;

    // Send emails asynchronously without blocking the response
    Promise.allSettled(
      emails.map(async (email) => {
        try {
          const otp = await this.otpUtils.generateAndSaveOtp(
            email,
            OtpType.AFFILIATE_INVITE,
          );

          if (
            type === AffiliateType.PLAYER ||
            type === AffiliateType.SUPPORTER
          ) {
            await this.emailService.sendPlayerSupporterInviteEmail(
              email,
              type.toLowerCase(),
              clubName,
              refCode,
              otp,
            );
          } else if (type === AffiliateType.COMPANY) {
            await this.emailService.sendCompanyInviteEmail(
              email,
              clubName,
              refCode,
              otp,
            );
          }
        } catch (error) {
          this.logger.error(`Failed to send email to ${email}:`, error);
        }
      }),
    ).catch((error) => {
      this.logger.error('Error in async email sending:', error);
    });
  }

  private async sendClubUpdateEmailsAsync(
    affiliates: Array<{ user: { email: string } | null }>,
    clubName: string,
    message: string,
  ): Promise<void> {
    if (affiliates.length === 0) return;

    // Send emails asynchronously without blocking the response
    Promise.allSettled(
      affiliates.map(async (affiliate) => {
        if (!affiliate.user?.email) return;

        try {
          await this.emailService.clubUpdateEmail(
            affiliate.user.email,
            message,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send club update email to ${affiliate.user.email}:`,
            error,
          );
        }
      }),
    ).catch((error) => {
      this.logger.error('Error in async club update email sending:', error);
    });
  }

  async getRevenueDashboard(userId: string) {
    this.logger.log(`Fetching revenue dashboard for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      // Get revenue metrics
      const [totalRevenue, paidOutRevenue, pendingRevenue, recentTransactions] = await Promise.all([
        // Total accumulated revenue (all paid invoices)
        this.prisma.invoice.aggregate({
          where: {
            clubId: club.id,
            status: InvoiceStatus.PAID,
          },
          _sum: {
            amount: true,
          },
        }),
        // Total paid out (withdrawals - for now using a percentage)
        this.prisma.invoice.aggregate({
          where: {
            clubId: club.id,
            status: InvoiceStatus.PAID,
          },
          _sum: {
            amount: true,
          },
        }),
        // Pending revenue (unpaid invoices)
        this.prisma.invoice.aggregate({
          where: {
            clubId: club.id,
            status: InvoiceStatus.PENDING,
          },
          _sum: {
            amount: true,
          },
        }),
        // Recent transactions (last 5)
        this.prisma.invoice.findMany({
          where: {
            clubId: club.id,
          },
          include: {
            company: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        }),
      ]);

      const totalAmount = totalRevenue._sum.amount || 0;
      const paidOutAmount = Math.round((paidOutRevenue._sum.amount || 0) * 0.4); // 40% paid out
      const pendingAmount = pendingRevenue._sum.amount || 0;
      const availableBalance = totalAmount - paidOutAmount;

      return {
        metrics: {
          totalAccumulatedRevenue: totalAmount,
          currentBalance: availableBalance,
          totalInvoicedRevenue: paidOutAmount,
          pendingRevenue: pendingAmount,
        },
        recentTransactions: recentTransactions.map((transaction) => ({
          id: transaction.id,
          date: transaction.createdAt.toISOString(),
          company: transaction.company.user.name,
          withdrawalId: transaction.invoiceCode,
          amount: `$${transaction.amount.toFixed(2)}`,
          status: transaction.status.toLowerCase(),
        })),
      };
    } catch (error) {
      this.logger.error(`Error fetching revenue dashboard: ${error.message}`);
      throw error;
    }
  }

  async getRevenueTransactions(userId: string, query: any) {
    this.logger.log(`Fetching revenue transactions for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const {
        page = 1,
        limit = 10,
        type,
        status,
        search,
        startDate,
        endDate,
      } = query;

      // Build where clause
      const where: any = {
        clubId: club.id,
      };

      if (status) {
        where.status = status.toUpperCase();
      }

      if (search) {
        where.OR = [
          { invoiceCode: { contains: search, mode: 'insensitive' } },
          {
            company: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get transactions with pagination
      const [transactions, total] = await Promise.all([
        this.prisma.invoice.findMany({
          where,
          include: {
            company: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.invoice.count({ where }),
      ]);

      return {
        data: transactions.map((transaction) => ({
          id: transaction.id,
          date: transaction.createdAt.toISOString(),
          company: transaction.company.user.name,
          withdrawalId: transaction.invoiceCode,
          amount: `$${transaction.amount.toFixed(2)}`,
          status: transaction.status.toLowerCase(),
        })),
        meta: {
          total,
          totalPages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching revenue transactions: ${error.message}`);
      throw error;
    }
  }

  async requestWithdrawal(userId: string, dto: any) {
    this.logger.log(`Processing withdrawal for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      // Verify the invoice exists and belongs to the club
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          invoiceCode: dto.invoiceId,
          clubId: club.id,
          status: InvoiceStatus.PAID,
        },
      });

      if (!invoice) {
        throw new BadRequestException('Invalid invoice ID or invoice not paid');
      }

      // Check if withdrawal amount is valid
      if (dto.amount > invoice.amount) {
        throw new BadRequestException('Withdrawal amount cannot exceed invoice amount');
      }

      //TODO: utils for payment provider

      this.logger.log(`Withdrawal processed: ${JSON.stringify({
        clubId: club.id,
        invoiceId: invoice.id,
        amount: dto.amount,
        notes: dto.notes,
      })}`);

      return {
        success: true,
        message: 'Withdrawal request submitted successfully. Status: Pending approval.',
        data: {
          transactionId: `TXN_${Date.now()}`,
          amount: dto.amount,
          status: 'pending',
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Error processing withdrawal: ${error.message}`);
      throw error;
    }
  }

  async getRevenueChart(userId: string, query: any) {
    this.logger.log(`Fetching revenue chart data for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const { period = 'this-month', startDate, endDate, months = 12 } = query;

      // Calculate date range based on period
      let dateRange: { start: Date; end: Date };
      const now = new Date();

      switch (period) {
        case 'this-month':
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
          };
          break;
        case 'last-month':
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
          };
          break;
        case 'this-year':
          dateRange = {
            start: new Date(now.getFullYear(), 0, 1),
            end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
          };
          break;
        case 'last-year':
          dateRange = {
            start: new Date(now.getFullYear() - 1, 0, 1),
            end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
          };
          break;
        case 'custom':
          if (!startDate || !endDate) {
            throw new BadRequestException('Start date and end date are required for custom period');
          }
          dateRange = {
            start: new Date(startDate),
            end: new Date(endDate),
          };
          break;
        default:
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
          };
      }

      // Get monthly revenue data
      const monthlyData = await this.prisma.invoice.groupBy({
        by: ['createdAt'],
        where: {
          clubId: club.id,
          status: InvoiceStatus.PAID,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Generate chart data for the last 12 months
      const chartData: Array<{ month: string; invoice: number; accumulate: number }> = [];
      const monthNames = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
      ];

      for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthNames[date.getMonth()];
        
        // Find revenue for this month
        const monthRevenue = monthlyData.find(item => {
          const itemDate = new Date(item.createdAt);
          return itemDate.getMonth() === date.getMonth() && 
                 itemDate.getFullYear() === date.getFullYear();
        });

        const invoiceAmount = monthRevenue?._sum.amount || 0;
        const accumulateAmount = invoiceAmount * 0.6; // 60% accumulated

        chartData.unshift({
          month: monthKey,
          invoice: invoiceAmount,
          accumulate: accumulateAmount,
        });
      }

      // Calculate totals
      const totalInflow = monthlyData.reduce((sum, item) => sum + (item._sum.amount || 0), 0);
      const totalOutflow = totalInflow * 0.4; // 40% paid out

      return {
        chartData,
        summary: {
          inflow: totalInflow,
          outflow: totalOutflow,
        },
        period: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching revenue chart data: ${error.message}`);
      throw error;
    }
  }

  async getHireHistory(userId: string, query: any) {
    this.logger.log(`Fetching hire history for club: ${userId}`);

    try {
      const club = await this.prisma.club.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const {
        page = 1,
        limit = 10,
        status,
        search,
        startDate,
        endDate,
        companyId,
      } = query;

      // Build where clause
      const where: any = {
        clubId: club.id,
      };

      if (status) {
        where.status = status.toUpperCase();
      }

      if (companyId) {
        where.companyId = companyId;
      }

      if (search) {
        where.OR = [
          { invoiceCode: { contains: search, mode: 'insensitive' } },
          {
            company: {
              user: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get hire history with pagination
      const [invoices, total] = await Promise.all([
        this.prisma.invoice.findMany({
          where,
          include: {
            company: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.invoice.count({ where }),
      ]);

      return {
        data: invoices.map((invoice) => ({
          id: invoice.id,
          name: `Athlete ${invoice.id.slice(-4)}`, // Placeholder for athlete name
          companyName: invoice.company.user.name,
          club: 'Elite FC', // Placeholder for club name
          clubAvatar: '', // Placeholder for club avatar
          invoiceId: invoice.invoiceCode,
          amount: invoice.amount,
          dateTime: invoice.createdAt.toISOString(),
        })),
        meta: {
          total,
          totalPages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching hire history: ${error.message}`);
      throw error;
    }
  }
}
