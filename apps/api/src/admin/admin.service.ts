import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MinioService } from 'src/utils/minio.utils';
import {
  AdminProfileResponseDto,
  ProfileResponseDto,
} from './dto/responses/profile-repsonse.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import {
  AffiliateStatus,
  AffiliateType,
  OtpType,
  Prisma,
  ShortlistedStatus,
  UserType,
} from '@prisma/client';
import { GetAffiliatesDto } from './dto/get-affiliate-query.dto';
import { AffiliateItemDto } from './dto/responses/get-affiliates-responses.dto';
import { GetUnclaimedAffiliatesQueryDto } from './dto/get-unclaimed-affiliates-invite-query.dto';
import { UnclaimedAffiliateItemDto } from './dto/responses/get-unclaimed-affiliates-invite-responses.dto';
import { GetUnapprovedAffiliatesQueryDto } from './dto/get-unapproved-affiliates-query.dto';
import { UpdateInviteDto } from './dto/affiliate-invite.dto';
import { EmailService } from 'src/email/email.service';
import { createPaginationMeta, OtpUtilsService } from 'src/utils';
import { UnapprovedUserDto } from './dto/responses/get-unapproved-affiliates-invite-responses.dto';
import { GetDashboardMetricsQueryDto } from './dto/get-dashboard-metrics-query.dto';
import { GetHireHistoryQueryDto } from './dto/get-hire-history-query.dto';
import { GetNewCompaniesQueryDto } from './dto/get-new-companies-query.dto';
import { GetInvoicesQueryDto, InvoiceTab } from './dto/get-invoices-query.dto';
import { HireHistoryItemDto } from './dto/responses/hire-history-response.dto';
import { NewCompanyItemDto } from './dto/responses/new-companies-response.dto';
import { InvoiceItemDto } from './dto/responses/invoices-response.dto';
import { InvoiceStatus } from '@prisma/client';
import { ExportInvoicesQueryDto } from './dto/export-invoices-query.dto';
import { GetRequestsQueryDto } from './dto/get-requests-query.dto';
import { RequestItemDto } from './dto/responses/requests-response.dto';
import {
  RequestDetailsDto,
  RequestEventDto,
} from './dto/responses/request-details-response.dto';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly PLATFORM_COMMISSION_RATE = 0.3; // 30% commission

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly minio: MinioService,
    private readonly otpUtils: OtpUtilsService,
  ) {}

  async getProfile(userId: string): Promise<AdminProfileResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Fetching admin profile for userId: ${userId}`);

    try {
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              email: true,
              userType: true,
              status: true,
              name: true,
            },
          },
        },
      });

      if (!admin) {
        this.logger.warn(`Admin profile not found for userId: ${userId}`);
        throw new NotFoundException({
          message: 'Admin profile not found',
          errors: [{ field: 'id', message: 'No admin record for this user' }],
        });
      }

      const profile: ProfileResponseDto = {
        id: admin.id,
        name: admin.user.name,
        email: admin.user.email,
        userType: admin.user.userType?.toLowerCase(),
        avatar: admin.avatar,
        status: admin.user.status?.toLowerCase(),
      };

      const duration = Date.now() - startTime;
      this.logger.log(`Admin profile fetched in ${duration}ms`);

      return {
        success: true,
        message: 'Profile fetched successfully',
        data: profile,
      } as AdminProfileResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Failed to fetch admin profile for userId: ${userId}`,
        error,
      );
      throw new InternalServerErrorException({
        message: 'Unable to retrieve admin profile',
        errors: [{ field: 'server', message: 'Internal server error' }],
      });
    }
  }

  async updateProfile(
    userId: string,
    dto?: UpdateAdminProfileDto,
    file?: Express.Multer.File,
  ) {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!admin) throw new NotFoundException('Admin not found');

      let avatarUrl: string | undefined;
      if (file) {
        try {
          const { publicUrl, s3Key } = await this.minio.uploadFile(
            file,
            userId,
            'avatar',
          );
          avatarUrl = publicUrl; // Use publicUrl instead of s3Key since files are now public
        } catch (error) {
          this.logger.error(
            `Failed to upload avatar for admin userId: ${userId}`,
            error,
          );
          throw new BadRequestException({
            message: 'Failed to upload avatar file',
            errors: [{ field: 'avatar', message: 'File upload failed' }],
          });
        }
      }

      await this.prisma.admin.update({
        where: { userId },
        data: {
          user: {
            update: {
              name: dto?.name,
            },
          },
          avatar: avatarUrl,
          securityQuestion: {
            update: {
              question: dto?.securityQuestion_question,
              answer: dto?.securityQuestion_answer,
            },
          },
        },
      });

      return { success: true, message: 'Admin profile updated successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update admin profile for userId: ${userId}`,
        error,
      );
      throw new InternalServerErrorException({
        message: 'Unable to update admin profile',
        errors: [{ field: 'server', message: 'Internal server error' }],
      });
    }
  }

  async getAffiliates(q: GetAffiliatesDto) {
    const page = Number(q.page ?? 1);
    const take = Number(q.limit ?? 10);
    const skip = (page - 1) * take;

    this.logger.log(`Fetching affiliates page=${page} limit=${take}`);

    try {
      const baseWhere: Prisma.AffiliateWhereInput = {
        isApproved: true,
        user: {
          name: { not: null },
        },
        type: { in: [AffiliateType.PLAYER, AffiliateType.SUPPORTER] },
      };

      if (q.status) {
        baseWhere.status = q.status;
      }

      if (q.type) {
        baseWhere.type = q.type;
      }

      if (q.clubId) {
        baseWhere.clubId = q.clubId;
      }

      if (q.search) {
        baseWhere.user = {
          name: {
            contains: q.search,
            mode: 'insensitive',
          },
        };
      }

      const [total, affiliates] = await Promise.all([
        this.prisma.affiliate.count({ where: baseWhere }),
        this.prisma.affiliate.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                player: {
                  select: {
                    id: true,
                  },
                },
                company: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            club: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                  },
                },
                avatar: true,
              },
            },
          },
        }),
      ]);

      const affiliateList: AffiliateItemDto[] = affiliates.map((affiliate) => {
        // Get the profile id based on type
        let profileId: string | null = null;
        if (
          affiliate.type === AffiliateType.PLAYER ||
          affiliate.type === AffiliateType.SUPPORTER
        ) {
          profileId = affiliate.user?.player?.id || null;
        } else if (affiliate.type === AffiliateType.COMPANY) {
          profileId = affiliate.user?.company?.id || null;
        }

        return {
          id: profileId || '',
          affiliateId: affiliate.id,
          name: affiliate.user?.name || '',
          email: affiliate.email,
          type: affiliate.type.toLowerCase(),
          status: affiliate.status.toLowerCase(),
          club: affiliate.club
            ? {
                id: affiliate.club.id,
                name: affiliate.club.user?.name || '',
                avatar: affiliate.club.avatar,
              }
            : null,
        };
      });

      this.logger.log(
        `Returned ${affiliateList.length} affiliates out of ${total} total`,
      );

      return {
        success: true,
        message: 'Affiliates fetched successfully',
        data: {
          data: affiliateList,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch affiliates:', error);
      throw new InternalServerErrorException(
        'Failed to fetch affiliates. Please try again later.',
      );
    }
  }

  async deleteAffiliate(id: string) {
    this.logger.log(`Deleting affiliate with id ${id}`);

    try {
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              player: true,
              company: true,
              club: true,
            },
          },
        },
      });

      if (!affiliate) {
        throw new NotFoundException('Affiliate not found');
      }

      await this.prisma.$transaction(
        async (tx) => {
          const userId = affiliate.userId;
          const user = affiliate.user;

          if (user && userId) {
            // Batch player-related deletions
            if (user.player) {
              const playerId = user.player.id;
              await Promise.all([
                tx.application.deleteMany({ where: { playerId } }),
                tx.shortlisted.deleteMany({ where: { playerId } }),
                tx.playerBookmark.deleteMany({ where: { playerId } }),
                tx.experience.deleteMany({ where: { playerId } }),
              ]);
              await tx.player.delete({ where: { id: playerId } });
            }

            // Batch company-related deletions
            if (user.company) {
              const companyId = user.company.id;
              await Promise.all([
                tx.job.deleteMany({ where: { companyId } }),
                tx.task.deleteMany({ where: { companyId } }),
              ]);
              await tx.company.delete({ where: { id: companyId } });
            }

            // Batch club-related deletions
            if (user.club) {
              const clubId = user.club.id;
              await Promise.all([
                tx.clubUpdate.deleteMany({ where: { clubId } }),
                tx.player.updateMany({
                  where: { clubId },
                  data: { clubId: null },
                }),
              ]);
              await tx.club.delete({ where: { id: clubId } });
            }

            // Batch user-related deletions
            await Promise.all([
              tx.notification.deleteMany({ where: { userId } }),
              tx.refreshToken.deleteMany({ where: { userId } }),
              tx.otpCode.deleteMany({ where: { userId } }),
              tx.otpCode.deleteMany({ where: { affiliateId: id } }),
            ]);

            await tx.user.delete({ where: { id: userId } });
          } else {
            // If no user, just delete affiliate OTP codes
            await tx.otpCode.deleteMany({ where: { affiliateId: id } });
          }

          // Finally delete the affiliate
          await tx.affiliate.delete({ where: { id } });
        },
        {
          maxWait: 10000,
          timeout: 30000, // 30 seconds should be enough with optimizations
        },
      );

      this.logger.log(`Affiliate with id ${id} deleted successfully`);

      return {
        success: true,
        message: 'Affiliate and all related data deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete affiliate ${id}:`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to delete affiliate. Please try again later.',
      );
    }
  }

  async getUnclaimedAffiliates(q: GetUnclaimedAffiliatesQueryDto) {
    const page = Number(q.page ?? 1);
    const take = Number(q.limit ?? 10);
    const skip = (page - 1) * take;

    this.logger.log(`Fetching unclaimed affiliates page=${page} limit=${take}`);

    try {
      const baseWhere: Prisma.AffiliateWhereInput = {
        userId: undefined,
        status: AffiliateStatus.PENDING,
      };

      if (q.invitedAt) {
        const invitedDate = new Date(q.invitedAt);
        const nextDay = new Date(invitedDate);
        nextDay.setDate(nextDay.getDate() + 1);

        baseWhere.createdAt = {
          gte: invitedDate,
          lt: nextDay,
        };
      }

      if (q.search) {
        baseWhere.OR = [
          {
            email: {
              contains: q.search,
              mode: 'insensitive',
            },
          },
          {
            club: {
              user: {
                name: {
                  contains: q.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ];
      }

      const [total, affiliates] = await Promise.all([
        this.prisma.affiliate.count({ where: baseWhere }),
        this.prisma.affiliate.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
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
              },
            },
          },
        }),
      ]);

      const affiliateList: UnclaimedAffiliateItemDto[] = affiliates.map(
        (affiliate) => ({
          id: affiliate.id,
          email: affiliate.email,
          type: affiliate.type.toLowerCase(),
          status: affiliate.status.toLowerCase(),
          club: affiliate.club
            ? {
                id: affiliate.club.id,
                name: affiliate.club.user?.name || '',
                avatar: affiliate.club.avatar,
              }
            : null,
          createdAt: affiliate.createdAt,
          updatedAt: affiliate.updatedAt,
        }),
      );

      this.logger.log(
        `Returned ${affiliateList.length} unclaimed affiliates out of ${total} total`,
      );

      return {
        success: true,
        message: 'Unclaimed affiliates fetched successfully',
        data: {
          data: affiliateList,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch unclaimed affiliates:', error);
      throw new InternalServerErrorException(
        'Failed to fetch unclaimed affiliates. Please try again later.',
      );
    }
  }

  async getUnapprovedAffiliates(q: GetUnapprovedAffiliatesQueryDto) {
    const page = Number(q.page ?? 1);
    const take = Number(q.limit ?? 10);
    const skip = (page - 1) * take;

    this.logger.log(
      `Fetching unapproved affiliates page=${page} limit=${take}`,
    );

    try {
      const baseWhere: Prisma.AffiliateWhereInput = {
        isApproved: false,
        user: {
          isNot: null,
        },
      };

      if (q.invitedAt) {
        const invitedDate = new Date(q.invitedAt);
        const nextDay = new Date(invitedDate);
        nextDay.setDate(nextDay.getDate() + 1);

        baseWhere.createdAt = {
          gte: invitedDate,
          lt: nextDay,
        };
      }

      if (q.clubId) {
        baseWhere.clubId = q.clubId;
      }

      if (q.search) {
        baseWhere.OR = [
          {
            email: {
              contains: q.search,
              mode: 'insensitive',
            },
          },
          {
            user: {
              name: {
                contains: q.search,
                mode: 'insensitive',
              },
            },
          },
          {
            club: {
              user: {
                name: {
                  contains: q.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ];
      }

      const [total, affiliates] = await Promise.all([
        this.prisma.affiliate.count({ where: baseWhere }),
        this.prisma.affiliate.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                company: {
                  select: {
                    id: true,
                  },
                },
                player: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            club: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                  },
                },
                avatar: true,
              },
            },
          },
        }),
      ]);

      const unapprovedUsers: UnapprovedUserDto[] = affiliates.map(
        (affiliate) => {
          let profileId: string | null = null;

          if (affiliate.user) {
            if (
              affiliate.type === AffiliateType.COMPANY &&
              affiliate.user.company
            ) {
              profileId = affiliate.user.company.id;
            } else if (
              (affiliate.type === AffiliateType.PLAYER ||
                affiliate.type === AffiliateType.SUPPORTER) &&
              affiliate.user.player
            ) {
              profileId = affiliate.user.player.id;
            }
          }

          return {
            id: affiliate.id,
            profileId,
            type: affiliate.type.toLowerCase() as
              | 'company'
              | 'player'
              | 'supporter',
            name: affiliate.user?.name || '',
            club: {
              id: affiliate.club!.id,
              name: affiliate.club!.user?.name || '',
              avatar: affiliate.club!.avatar,
            },
            invitedAt: affiliate.createdAt.toISOString(),
            hasSignedUp: !!affiliate.user,
          };
        },
      );

      this.logger.log(
        `Returned ${unapprovedUsers.length} unapproved users out of ${total} total`,
      );

      return {
        success: true,
        message: 'Unapproved affiliates fetched successfully',
        data: {
          data: unapprovedUsers,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch unapproved affiliates:', error);
      throw new InternalServerErrorException(
        'Failed to fetch unapproved affiliates. Please try again later.',
      );
    }
  }

  async updateInvite(id: string, dto: UpdateInviteDto) {
    const { status } = dto;

    this.logger.log(`Updating invite ${id} with status: ${status}`);

    try {
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!affiliate) {
        this.logger.warn(`Invite not found: ${id}`);
        throw new NotFoundException('Invite not found');
      }

      if (status === 'approved') {
        await this.prisma.affiliate.update({
          where: { id },
          data: {
            isApproved: true,
            status: AffiliateStatus.ACTIVE,
          },
        });

        this.logger.log(`Invite ${id} approved successfully`);
        return {
          success: true,
          message: 'Invite approved',
        };
      } else if (status === 'declined') {
        const email = affiliate.email;
        const userId = affiliate.userId;

        await this.prisma.$transaction(async (tx) => {
          await tx.affiliate.delete({
            where: { id },
          });

          if (userId) {
            await tx.user.delete({
              where: { id: userId },
            });
          }

          await this.emailService.declineAffiliateInviteEmail(email);
        });

        this.logger.log(`Invite ${id} declined and deleted successfully`);
        return {
          success: true,
          message: 'Invite declined',
        };
      }
    } catch (error) {
      this.logger.error(`Failed to update invite ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update invite. Please try again later.',
      );
    }
  }

  async resendInvite(id: string) {
    this.logger.log(`Resending invite for affiliate ${id}`);

    try {
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id },
        include: {
          club: {
            select: {
              id: true,
              refCode: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!affiliate) {
        this.logger.warn(`Affiliate not found: ${id}`);
        throw new NotFoundException('Invite not found');
      }

      if (affiliate.userId && affiliate.status !== AffiliateStatus.PENDING) {
        this.logger.warn(`Invite already claimed for affiliate: ${id}`);
        throw new BadRequestException('This invite has already been claimed');
      }

      // All affiliates must be linked to a club
      if (!affiliate.club) {
        this.logger.error(`Affiliate ${id} not linked to any club`);
        throw new InternalServerErrorException(
          'Affiliate is not linked to a club',
        );
      }

      const otp = await this.otpUtils.generateAndSaveOtp(
        affiliate.email,
        OtpType.AFFILIATE_INVITE,
        undefined,
        affiliate.id,
      );

      switch (affiliate.type) {
        case AffiliateType.COMPANY:
          await this.emailService.sendCompanyInviteEmail(
            affiliate.email,
            affiliate.club.user?.name || '',
            affiliate.club.refCode,
            otp,
          );
          break;

        case AffiliateType.PLAYER:
        case AffiliateType.SUPPORTER:
          await this.emailService.sendPlayerSupporterInviteEmail(
            affiliate.email,
            affiliate.type.toLowerCase(),
            affiliate.club.user?.name || '',
            affiliate.club.refCode,
            otp,
          );
          break;

        default:
          this.logger.error(`Invalid affiliate type: ${affiliate.type}`);
          throw new BadRequestException('Invalid affiliate type');
      }

      this.logger.log(`Invite resent successfully for affiliate ${id}`);
      return {
        success: true,
        message: 'Invite has been resent successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to resend invite for affiliate ${id}:`, error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to resend invite. Please try again later.',
      );
    }
  }

  async getDashboard(q: GetDashboardQueryDto) {
    this.logger.log(`Fetching combined dashboard data for period: ${q.period}`);

    try {
      // Call the three methods in parallel
      const [metrics, hireHistory, newCompanies] = await Promise.all([
        this.getDashboardMetricsInternal({ period: q.period }),
        this.getHireHistoryInternal({
          page: q.hireHistoryPage || 1,
          limit: q.hireHistoryLimit || 5,
          search: q.hireHistorySearch,
          hiredAt: q.hireHistoryHiredAt,
        }),
        this.getNewCompaniesInternal({
          page: q.newCompaniesPage || 1,
          limit: q.newCompaniesLimit || 2,
          search: q.newCompaniesSearch,
          signupDate: q.newCompaniesSignupDate,
          status: q.newCompaniesStatus,
        }),
      ]);

      return {
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          metrics: metrics.data,
          hireHistory: hireHistory.data.data,
          newCompanies: newCompanies.data.data,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch combined dashboard data:', error);
      throw new InternalServerErrorException(
        'Failed to fetch dashboard data. Please try again later.',
      );
    }
  }

  async getDashboardMetrics(q: GetDashboardMetricsQueryDto) {
    return this.getDashboardMetricsInternal(q);
  }

  private async getDashboardMetricsInternal(q: GetDashboardMetricsQueryDto) {
    this.logger.log(`Fetching dashboard metrics for period: ${q.period}`);

    try {
      const now = new Date();
      const { currentStart, currentEnd, previousStart, previousEnd } =
        this.getDateRangesForPeriod(q.period || 'LAST_WEEK', now);

      // Fetch current period metrics
      const [
        currentRevenue,
        currentInvoiced,
        currentCompanySignups,
        currentHires,
        currentUsers,
      ] = await Promise.all([
        this.prisma.revenue.aggregate({
          where: {
            recordedAt: { gte: currentStart, lte: currentEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            createdAt: { gte: currentStart, lte: currentEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.company.count({
          where: {
            createdAt: { gte: currentStart, lte: currentEnd },
          },
        }),
        this.prisma.shortlisted.count({
          where: {
            status: ShortlistedStatus.HIRED,
            hiredAt: { gte: currentStart, lte: currentEnd },
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: currentStart, lte: currentEnd },
          },
        }),
      ]);

      // Fetch previous period metrics
      const [
        previousRevenue,
        previousInvoiced,
        previousCompanySignups,
        previousHires,
        previousUsers,
      ] = await Promise.all([
        this.prisma.revenue.aggregate({
          where: {
            recordedAt: { gte: previousStart, lte: previousEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            createdAt: { gte: previousStart, lte: previousEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.company.count({
          where: {
            createdAt: { gte: previousStart, lte: previousEnd },
          },
        }),
        this.prisma.shortlisted.count({
          where: {
            status: ShortlistedStatus.HIRED,
            hiredAt: { gte: previousStart, lte: previousEnd },
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: previousStart, lte: previousEnd },
          },
        }),
      ]);

      const calculateMetric = (current: number, previous: number) => ({
        current,
        previous,
        percentageChange:
          previous > 0 ? ((current - previous) / previous) * 100 : 0,
      });

      return {
        success: true,
        message: 'Dashboard metrics fetched successfully',
        data: {
          totalRevenue: calculateMetric(
            currentRevenue._sum.amount || 0,
            previousRevenue._sum.amount || 0,
          ),
          totalInvoiced: calculateMetric(
            currentInvoiced._sum.amount || 0,
            previousInvoiced._sum.amount || 0,
          ),
          companySignups: calculateMetric(
            currentCompanySignups,
            previousCompanySignups,
          ),
          companyHires: calculateMetric(currentHires, previousHires),
          totalUsers: calculateMetric(currentUsers, previousUsers),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch dashboard metrics:', error);
      throw new InternalServerErrorException(
        'Failed to fetch dashboard metrics. Please try again later.',
      );
    }
  }

  async getHireHistory(q: GetHireHistoryQueryDto) {
    return this.getHireHistoryInternal(q);
  }

  private async getHireHistoryInternal(q: GetHireHistoryQueryDto) {
    const page = Number(q.page ?? 1);
    const take = Number(q.limit ?? 10);
    const skip = (page - 1) * take;

    this.logger.log(`Fetching hire history page=${page} limit=${take}`);

    try {
      const baseWhere: Prisma.ShortlistedWhereInput = {
        status: ShortlistedStatus.HIRED,
        hiredAt: { not: null },
      };

      if (q.hiredAt) {
        const hiredDate = new Date(q.hiredAt);
        const nextDay = new Date(hiredDate);
        nextDay.setDate(nextDay.getDate() + 1);

        baseWhere.hiredAt = {
          gte: hiredDate,
          lt: nextDay,
        };
      }

      if (q.search) {
        baseWhere.OR = [
          {
            player: {
              user: {
                name: {
                  contains: q.search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            job: {
              company: {
                user: {
                  name: {
                    contains: q.search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
          {
            player: {
              club: {
                user: {
                  name: {
                    contains: q.search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        ];
      }

      const [total, hires] = await Promise.all([
        this.prisma.shortlisted.count({ where: baseWhere }),
        this.prisma.shortlisted.findMany({
          where: baseWhere,
          orderBy: { hiredAt: 'desc' },
          skip,
          take,
          include: {
            player: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                club: {
                  include: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            job: {
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
            },
            invoice: true,
          },
        }),
      ]);

      const hireList: HireHistoryItemDto[] = hires.map((hire) => ({
        id: hire.id,
        playerName: hire.player.user?.name || '',
        playerEmail: hire.player.user?.email || '',
        companyName: hire.job.company.user?.name || '',
        companyId: hire.job.companyId,
        clubName: hire.player.club?.user?.name || '',
        clubAvatar: hire.player.club?.avatar || '',
        clubId: hire.player.clubId || '',
        invoiceCode: hire.invoice?.invoiceCode || '',
        invoiceId: hire.invoiceId || '',
        amount: hire.invoice
          ? hire.invoice.amount * this.PLATFORM_COMMISSION_RATE
          : 0,
        hiredAt: hire.hiredAt?.toISOString().split('T')[0] || '',
      }));

      this.logger.log(
        `Returned ${hireList.length} hires out of ${total} total`,
      );

      return {
        success: true,
        message: 'Hire history fetched successfully',
        data: {
          data: hireList,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch hire history:', error);
      throw new InternalServerErrorException(
        'Failed to fetch hire history. Please try again later.',
      );
    }
  }

  async getNewCompanies(q: GetNewCompaniesQueryDto) {
    return this.getNewCompaniesInternal(q);
  }

  private async getNewCompaniesInternal(q: GetNewCompaniesQueryDto) {
    const page = Number(q.page ?? 1);
    const take = Number(q.limit ?? 10);
    const skip = (page - 1) * take;

    this.logger.log(`Fetching new companies page=${page} limit=${take}`);

    try {
      const baseWhere: Prisma.CompanyWhereInput = {};

      if (q.status) {
        baseWhere.user = {
          status: q.status,
        };
      }

      if (q.signupDate) {
        const signupDate = new Date(q.signupDate);
        const nextDay = new Date(signupDate);
        nextDay.setDate(nextDay.getDate() + 1);

        baseWhere.createdAt = {
          gte: signupDate,
          lt: nextDay,
        };
      }

      if (q.search) {
        if (!baseWhere.user) {
          baseWhere.user = {};
        }
        baseWhere.user.name = {
          contains: q.search,
          mode: 'insensitive',
        };
      }

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
                email: true,
                status: true,
              },
            },
          },
        }),
      ]);

      const companyList: NewCompanyItemDto[] = companies.map((company) => ({
        id: company.id,
        name: company.user?.name || '',
        email: company.user?.email || '',
        industry: company.industry || '',
        status: company.user?.status?.toLowerCase() || '',
        signupDate: company.createdAt.toISOString().split('T')[0],
      }));

      this.logger.log(
        `Returned ${companyList.length} companies out of ${total} total`,
      );

      return {
        success: true,
        message: 'New companies fetched successfully',
        data: {
          data: companyList,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch new companies:', error);
      throw new InternalServerErrorException(
        'Failed to fetch new companies. Please try again later.',
      );
    }
  }

  async getInvoices(q: GetInvoicesQueryDto) {
    const page = Number(q.page ?? 1);
    const take = Number(q.limit ?? 10);
    const skip = (page - 1) * take;

    this.logger.log(
      `Fetching invoices page=${page} limit=${take} tab=${q.tab}`,
    );

    try {
      if (q.tab === InvoiceTab.CLUB) {
        const where = this.buildClubInvoiceWhereClause(
          q.status,
          q.invoiceDate,
          q.search,
        );

        const [total, invoices] = await Promise.all([
          this.prisma.invoice.count({ where }),
          this.prisma.invoice.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            include: {
              club: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
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
          }),
        ]);

        const invoiceList = invoices.map(this.mapClubInvoiceToDto.bind(this));

        this.logger.log(
          `Returned ${invoiceList.length} club invoices out of ${total} total`,
        );

        return {
          success: true,
          message: 'Club invoices fetched successfully',
          data: {
            data: invoiceList,
            ...createPaginationMeta(total, page, take),
          },
        };
      }

      // Handle company invoices (linked to shortlisted)
      const where = this.buildCompanyInvoiceWhereClause(
        q.status,
        q.invoiceDate,
        q.search,
      );

      const [total, invoices] = await Promise.all([
        this.prisma.shortlisted.count({ where }),
        this.prisma.shortlisted.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            player: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                club: {
                  include: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            job: {
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
            },
            invoice: true,
          },
        }),
      ]);

      const invoiceList = invoices.map(this.mapCompanyInvoiceToDto.bind(this));

      this.logger.log(
        `Returned ${invoiceList.length} invoices out of ${total} total`,
      );

      return {
        success: true,
        message: 'Invoices fetched successfully',
        data: {
          data: invoiceList,
          ...createPaginationMeta(total, page, take),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch invoices:', error);
      throw new InternalServerErrorException(
        'Failed to fetch invoices. Please try again later.',
      );
    }
  }

  private getDateRangesForPeriod(
    period: string,
    now: Date,
  ): {
    currentStart: Date;
    currentEnd: Date;
    previousStart: Date;
    previousEnd: Date;
  } {
    const currentEnd = now;
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (period) {
      case 'TODAY':
        currentStart = new Date(now);
        currentStart.setHours(0, 0, 0, 0);
        previousEnd = new Date(currentStart);
        previousEnd.setSeconds(previousEnd.getSeconds() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setHours(0, 0, 0, 0);
        break;

      case 'YESTERDAY':
        currentEnd.setHours(23, 59, 59, 999);
        currentEnd.setDate(currentEnd.getDate() - 1);
        currentStart = new Date(currentEnd);
        currentStart.setHours(0, 0, 0, 0);
        previousEnd = new Date(currentStart);
        previousEnd.setSeconds(previousEnd.getSeconds() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setHours(0, 0, 0, 0);
        break;

      case 'LAST_WEEK':
        currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousEnd.setSeconds(previousEnd.getSeconds() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 7);
        break;

      case 'LAST_MONTH':
        currentStart = new Date(now);
        currentStart.setMonth(currentStart.getMonth() - 1);
        previousEnd = new Date(currentStart);
        previousEnd.setSeconds(previousEnd.getSeconds() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setMonth(previousStart.getMonth() - 1);
        break;

      case 'LAST_YEAR':
        currentStart = new Date(now);
        currentStart.setFullYear(currentStart.getFullYear() - 1);
        previousEnd = new Date(currentStart);
        previousEnd.setSeconds(previousEnd.getSeconds() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setFullYear(previousStart.getFullYear() - 1);
        break;

      default:
        // Default to last week
        currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousEnd.setSeconds(previousEnd.getSeconds() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 7);
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  /**
   * Helper method to build date filter for invoice queries
   */
  private buildInvoiceDateFilter(
    invoiceDate?: string,
  ): { gte: Date; lt: Date } | undefined {
    if (!invoiceDate) return undefined;

    const date = new Date(invoiceDate);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    return { gte: date, lt: nextDay };
  }

  /**
   * Helper method to build where clause for club invoices
   */
  private buildClubInvoiceWhereClause(
    status?: string,
    invoiceDate?: string,
    search?: string,
  ): Prisma.InvoiceWhereInput {
    const where: Prisma.InvoiceWhereInput = {
      clubId: { not: null },
    };

    if (status) {
      where.status = status as InvoiceStatus;
    }

    const dateFilter = this.buildInvoiceDateFilter(invoiceDate);
    if (dateFilter) {
      where.createdAt = dateFilter;
    }

    if (search) {
      where.OR = [
        {
          invoiceCode: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          club: {
            user: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          company: {
            user: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    return where;
  }

  /**
   * Helper method to build where clause for company invoices (via shortlisted)
   */
  private buildCompanyInvoiceWhereClause(
    status?: string,
    invoiceDate?: string,
    search?: string,
  ): Prisma.ShortlistedWhereInput {
    const where: Prisma.ShortlistedWhereInput = {
      status: ShortlistedStatus.HIRED,
      invoice: { isNot: null },
    };

    if (status || invoiceDate) {
      where.invoice = {};

      if (status) {
        where.invoice.status = status as InvoiceStatus;
      }

      const dateFilter = this.buildInvoiceDateFilter(invoiceDate);
      if (dateFilter) {
        where.invoice.createdAt = dateFilter;
      }
    }

    if (search) {
      where.OR = [
        {
          player: {
            user: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          job: {
            company: {
              user: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
        {
          invoice: {
            invoiceCode: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    return where;
  }

  /**
   * Helper method to map club invoice to DTO
   */
  private mapClubInvoiceToDto(invoice: any): InvoiceItemDto {
    return {
      id: invoice.id,
      playerName: '',
      playerEmail: '',
      companyName: invoice.company.user?.name || '',
      companyId: invoice.companyId,
      clubName: invoice.club?.user?.name || '',
      clubId: invoice.clubId || '',
      clubAvatar: invoice?.club?.avatar || '',
      invoiceCode: invoice.invoiceCode,
      invoiceId: invoice.id,
      amount: invoice.amount * this.PLATFORM_COMMISSION_RATE,
      invoiceDate: invoice.createdAt.toISOString().split('T')[0],
      status: invoice.status,
    };
  }

  /**
   * Helper method to map company invoice (shortlisted) to DTO
   */
  private mapCompanyInvoiceToDto(item: any): InvoiceItemDto {
    return {
      id: item.id,
      playerName: item.player.user?.name || '',
      playerEmail: item.player.user?.email || '',
      companyName: item.job.company.user?.name || '',
      companyId: item.job.companyId,
      clubAvatar: item.player.club?.avatar || '',
      clubName: item.player.club?.user?.name || '',
      clubId: item.player.clubId || '',
      invoiceCode: item.invoice?.invoiceCode || '',
      invoiceId: item.invoiceId || '',
      amount: item.invoice
        ? item.invoice.amount * this.PLATFORM_COMMISSION_RATE
        : 0,
      invoiceDate: item.invoice?.createdAt.toISOString().split('T')[0] || '',
      status: item.invoice?.status || '',
    };
  }

  async getInvoiceStats(tab?: InvoiceTab) {
    this.logger.log(`Fetching invoice statistics for tab: ${tab || 'all'}`);

    try {
      const baseWhere: Prisma.InvoiceWhereInput = {};

      // If tab is specified, filter by company or club
      if (tab === InvoiceTab.COMPANY) {
        baseWhere.clubId = null;
      } else if (tab === InvoiceTab.CLUB) {
        baseWhere.clubId = { not: null };
      }

      const [paidCount, pendingCount, totalCount] = await Promise.all([
        this.prisma.invoice.count({
          where: {
            ...baseWhere,
            status: InvoiceStatus.PAID,
          },
        }),
        this.prisma.invoice.count({
          where: {
            ...baseWhere,
            status: InvoiceStatus.PENDING,
          },
        }),
        this.prisma.invoice.count({ where: baseWhere }),
      ]);

      this.logger.log(
        `Invoice stats - Paid: ${paidCount}, Pending: ${pendingCount}, Total: ${totalCount}`,
      );

      return {
        success: true,
        message: 'Invoice statistics fetched successfully',
        data: {
          paidCount,
          pendingCount,
          totalCount,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch invoice statistics:', error);
      throw new InternalServerErrorException(
        'Failed to fetch invoice statistics. Please try again later.',
      );
    }
  }

  async exportInvoices(q: ExportInvoicesQueryDto) {
    this.logger.log(`Exporting invoices tab=${q.tab} format=${q.format}`);

    try {
      // Use cursor-based pagination to prevent memory issues with large datasets
      const BATCH_SIZE = 1000;
      const allInvoices: InvoiceItemDto[] = [];
      let cursor: string | undefined = undefined;
      let hasMore = true;

      if (q.tab === InvoiceTab.CLUB) {
        const where = this.buildClubInvoiceWhereClause(
          q.status,
          q.invoiceDate,
          q.search,
        );

        while (hasMore) {
          const invoices = await this.prisma.invoice.findMany({
            where,
            take: BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
              club: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
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
          });

          const mapped = invoices.map(this.mapClubInvoiceToDto.bind(this));
          allInvoices.push(...mapped);

          if (invoices.length < BATCH_SIZE) {
            hasMore = false;
          } else {
            cursor = invoices[invoices.length - 1].id;
          }

          this.logger.log(
            `Fetched ${invoices.length} club invoices (total: ${allInvoices.length})`,
          );
        }

        this.logger.log(`Exporting ${allInvoices.length} club invoices`);

        return {
          success: true,
          message: 'Club invoices exported successfully',
          data: allInvoices,
        };
      }

      // Handle company invoices (linked to shortlisted)
      const where = this.buildCompanyInvoiceWhereClause(
        q.status,
        q.invoiceDate,
        q.search,
      );

      while (hasMore) {
        const invoices = await this.prisma.shortlisted.findMany({
          where,
          take: BATCH_SIZE,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: 'desc' },
          include: {
            player: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                club: {
                  include: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            job: {
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
            },
            invoice: true,
          },
        });

        const mapped = invoices.map(this.mapCompanyInvoiceToDto.bind(this));
        allInvoices.push(...mapped);

        if (invoices.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          cursor = invoices[invoices.length - 1].id;
        }

        this.logger.log(
          `Fetched ${invoices.length} company invoices (total: ${allInvoices.length})`,
        );
      }

      this.logger.log(`Exporting ${allInvoices.length} company invoices`);

      return {
        success: true,
        message: 'Invoices exported successfully',
        data: allInvoices,
      };
    } catch (error) {
      this.logger.error('Failed to export invoices:', error);
      throw new InternalServerErrorException(
        'Failed to export invoices. Please try again later.',
      );
    }
  }

  async getRequests(q: GetRequestsQueryDto) {
    this.logger.log(`Fetching requests page=${q.page} limit=${q.limit}`);

    try {
      const page = q.page || 1;
      const limit = q.limit || 10;
      const skip = (page - 1) * limit;

      // Build where filter
      const where: Prisma.HireRequestWhereInput = {};

      if (q.status) {
        where.status = q.status;
      }

      if (q.requestDate) {
        const requestDate = new Date(q.requestDate);
        const nextDay = new Date(requestDate);
        nextDay.setDate(nextDay.getDate() + 1);

        where.createdAt = {
          gte: requestDate,
          lt: nextDay,
        };
      }

      if (q.search) {
        where.OR = [
          { requestCode: { contains: q.search, mode: 'insensitive' } },
          {
            player: {
              user: {
                name: {
                  contains: q.search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            company: {
              user: {
                name: {
                  contains: q.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ];
      }

      // Fetch requests with pagination
      const [requests, total] = await Promise.all([
        this.prisma.hireRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            player: {
              include: {
                user: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
            company: {
              include: {
                user: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
            initiator: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
            recipient: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
          },
        }),
        this.prisma.hireRequest.count({ where }),
      ]);

      const requestList: RequestItemDto[] = requests.map((request) => {
        const isPlayerInitiator =
          request.initiator.id === request.player.user.id;
        const initiatorName = request.initiator.name || '';
        const recipientName = request.recipient.name || '';

        return {
          id: request.id,
          chatId: request.chatId,
          dateTime: request.createdAt.toISOString().split('T')[0],
          requestId: request.requestCode,
          initiator: isPlayerInitiator ? 'player' : 'company',
          initiatorName,
          recipient: isPlayerInitiator ? 'company' : 'player',
          recipientName,
          status: this.formatRequestStatus(request.status),
        };
      });

      return {
        success: true,
        message: 'Requests fetched successfully',
        data: {
          data: requestList,
          ...createPaginationMeta(total, page, limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch requests:', error);
      throw new InternalServerErrorException(
        'Failed to fetch requests. Please try again later.',
      );
    }
  }

  async getRequestDetails(requestId: string) {
    this.logger.log(`Fetching request details for requestId=${requestId}`);

    try {
      const request = await this.prisma.hireRequest.findUnique({
        where: { id: requestId },
        include: {
          player: {
            include: {
              user: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
          company: {
            include: {
              user: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
          initiator: {
            select: {
              id: true,
              name: true,
              userType: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              userType: true,
            },
          },
          events: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException(`Request with ID ${requestId} not found`);
      }

      const isPlayerInitiator = request.initiator.id === request.player.user.id;
      const initiatorName = request.initiator.name || '';
      const recipientName = request.recipient.name || '';

      const events: RequestEventDto[] = request.events.map((event) => ({
        eventType: event.eventType,
        description: this.formatEventDescription(event.eventType),
        createdAt: event.createdAt.toISOString(),
        metadata: event.metadata as Record<string, any>,
      }));

      const requestDetails: RequestDetailsDto = {
        id: request.id,
        chatId: request.chatId,
        requestCode: request.requestCode,
        initiator: isPlayerInitiator ? 'player' : 'company',
        initiatorName,
        recipient: isPlayerInitiator ? 'company' : 'player',
        recipientName,
        status: this.formatRequestStatus(request.status),
        events,
      };

      return {
        success: true,
        message: 'Request details fetched successfully',
        data: requestDetails,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch request details:', error);
      throw new InternalServerErrorException(
        'Failed to fetch request details. Please try again later.',
      );
    }
  }

  async getChatTimeline(chatId: string) {
    this.logger.log(`Fetching chat timeline for chatId=${chatId}`);

    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: { id: true },
      });

      if (!chat) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }

      const events = await this.prisma.chatEvent.findMany({
        where: { chatId },
        orderBy: { createdAt: 'desc' },
      });

      const timeline = events.map((event) => ({
        id: event.id,
        description:
          event.description || this.formatEventDescription(event.eventType),
        createdAt: event.createdAt.toISOString(),
      }));

      return {
        success: true,
        message: 'Chat timeline fetched successfully',
        data: timeline,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch chat timeline:', error);
      throw new InternalServerErrorException(
        'Failed to fetch chat timeline. Please try again later.',
      );
    }
  }

  private formatRequestStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'Pending',
      HIRED: 'Hired',
      CLOSED: 'Closed',
      CANCELLED: 'Cancelled',
    };
    return statusMap[status] || status;
  }

  private formatEventDescription(eventType: string): string {
    const descriptionMap: Record<string, string> = {
      DISCUSSION_INITIATED: 'Company initiated the discussion',
      DISCUSSION_ACCEPTED: 'Discussion accepted',
      DISCUSSION_REJECTED: 'Discussion rejected by Player',
      MESSAGE_SENT: 'Message sent',
      GRACE_PERIOD_INITIATED: 'Company initiated an extra 14 days grace period',
      DAYS_PASSED_REMINDER: '23 days have passed since the start',
      PLAYER_HIRED: 'Player hired',
      CONVERSATION_CANCELLED: 'Conversation cancelled by company',
      CONVERSATION_ENDED: 'Conversation ended',
    };
    return descriptionMap[eventType] || eventType;
  }

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
    this.logger.log(`Updating invoice ${invoiceId} status to ${status}`);

    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status,
          paidAt: status === InvoiceStatus.PAID ? new Date() : invoice.paidAt,
        },
      });

      this.logger.log(`Invoice ${invoiceId} status updated successfully`);
      return {
        success: true,
        message: `Invoice status updated to ${status}`,
      };
    } catch (error) {
      this.logger.error(`Failed to update invoice ${invoiceId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update invoice status. Please try again later.',
      );
    }
  }
}
