import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClubService } from './club.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompleteProfileDto } from './dto/club-complete-profile.dto';
import { CompleteProfileResponseDto } from './dto/responses/complete-profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileResponseDto } from './dto/responses/update-profile-response.dto';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { CreateAffiliateResponseDto } from './dto/responses/create-affiliate-response.dto';
import { GetAffiliatesDto } from './dto/get-affiliates-query.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserTypeGuard } from 'src/common/guards/user-type.guard';
import { UserType } from '@prisma/client';
import { UserType as UserTypeDecorator } from 'src/common/decorators/user-type.decorator';
import { CreateClubUpdateDto } from './dto/create-club-update.dto';
import { GetClubUpdatesDto } from './dto/get-club-updates.dto';
import { SaveAffiliateDto } from './dto/save-affiliate.dto';
import { GetRevenueTransactionsDto } from './dto/get-revenue-transactions.dto';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { GetClubDashboardQueryDto } from './dto/get-club-dashboard-query.dto';
import { GetRevenueChartDto } from './dto/get-revenue-chart.dto';
import { GetHireHistoryDto } from './dto/get-hire-history.dto';

@ApiTags('Club')
@Controller('club')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypeDecorator(UserType.CLUB)
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  @ApiOperation({
    summary: 'Complete club profile step by step',
    description: 'Multi-step club profile completion with file uploads',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Club profile completion data with optional files',
    type: CompleteProfileDto,
    schema: {
      type: 'object',
      properties: {
        step: { type: 'number', example: 1, minimum: 1, maximum: 3 },
        // Step 1
        category: { type: 'string', example: 'Premier League' },
        about: { type: 'string', example: 'We are a leading sports club...' },
        'address[street]': { type: 'string', example: '123 Main St' },
        'address[city]': { type: 'string', example: 'New York' },
        'address[postalCode]': { type: 'string', example: '10001' },
        preferredColor: { type: 'string', example: '#FF5733' },
        phone: { type: 'string', example: '+1234567890' },
        'region[primary]': { type: 'string', example: 'Europe' },
        'region[secondary][]': {
          type: 'array',
          items: { type: 'string' },
          example: ['North America', 'Asia'],
        },
        // Step 2
        focus: { type: 'string', example: 'Youth Development' },
        'socials[facebook]': {
          type: 'string',
          example: 'https://facebook.com/club',
        },
        'socials[twitter]': {
          type: 'string',
          example: 'https://twitter.com/club',
        },
        'socials[instagram]': {
          type: 'string',
          example: 'https://instagram.com/club',
        },
        website: { type: 'string', example: 'https://club.com' },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Club avatar/logo (image file)',
        },
        banner: {
          type: 'string',
          format: 'binary',
          description: 'Club banner (image file)',
        },
        // Step 3
        'securityQuestion[question]': {
          type: 'string',
          example: 'What is your favorite color?',
        },
        'securityQuestion[answer]': { type: 'string', example: 'Blue' },
      },
    },
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Profile step completed successfully',
    CompleteProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid step or validation error',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async completeProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: CompleteProfileDto,
    @UploadedFiles()
    files?: { avatar?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    const processedFiles = {
      avatar: files?.avatar?.[0],
      banner: files?.banner?.[0],
    };
    return this.clubService.completeProfile(userId, dto, processedFiles);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Club Profile',
    description: 'Update club profile information with optional file uploads',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Club profile updated successfully',
    UpdateProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Bad request - Invalid data provided',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFiles()
    files?: { avatar?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    const processedFiles = {
      avatar: files?.avatar?.[0],
      banner: files?.banner?.[0],
    };
    return this.clubService.updateProfile(userId, dto, processedFiles);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Club Profile',
    description:
      "Retrieve the authenticated club's profile information including approval status",
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Club profile retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.clubService.getProfile(userId);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Club Dashboard',
    description:
      'Retrieve club dashboard metrics including player counts, hired players, and partners',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Dashboard data retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getDashboard(
    @CurrentUser('userId') userId: string,
    @Query() query: GetClubDashboardQueryDto,
  ) {
    return this.clubService.getDashboard(userId, query);
  }

  @Post('affiliates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Affiliate Invitations',
    description:
      'Send affiliate invitations to players, supporters, or companies',
  })
  @ApiBody({ type: CreateAffiliateDto })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Affiliate invitations sent successfully',
    CreateAffiliateResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Bad request - Invalid data provided',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async createAffiliate(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateAffiliateDto,
  ) {
    return this.clubService.createAffiliate(userId, dto);
  }

  @Get('affiliates')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, UserTypeGuard)
  @UserTypeDecorator(UserType.CLUB)
  @ApiOperation({
    summary: 'Get Club Affiliates',
    description:
      'Retrieve paginated list of club affiliates with filtering options',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Affiliates retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getAffiliates(
    @CurrentUser('userId') userId: string,
    @Query() query: GetAffiliatesDto,
  ) {
    return this.clubService.getAffiliates(userId, query);
  }

  @Delete('affiliates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decline Affiliate Request',
    description:
      'Decline and remove an affiliate invitation, sending a decline email',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Affiliate declined successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club or affiliate not found',
    ErrorResponseDto,
  )
  async declineAffiliate(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.clubService.declineAffiliate(userId, id);
  }

  @Post('updates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Club Update',
    description: 'Create a new club update and notify all affiliates via email',
  })
  @ApiBody({ type: CreateClubUpdateDto })
  @ApiResponseDecorator(HttpStatus.OK, 'Club update created successfully')
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Bad request - Invalid data provided',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async createClubUpdate(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateClubUpdateDto,
  ) {
    return this.clubService.createClubUpdate(userId, dto);
  }

  @Get('updates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Club Updates',
    description: 'Retrieve paginated list of club updates/announcements',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Club updates retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getClubUpdates(
    @CurrentUser('userId') userId: string,
    @Query() query: GetClubUpdatesDto,
  ) {
    return this.clubService.getClubUpdates(userId, query);
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save/Unsave Affiliate',
    description: "Save or unsave an affiliate to/from the club's saved list",
  })
  @ApiBody({ type: SaveAffiliateDto })
  @ApiResponseDecorator(HttpStatus.OK, 'Affiliate saved/unsaved successfully')
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Bad request - Invalid data provided',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club or user not found',
    ErrorResponseDto,
  )
  async saveAffiliate(
    @CurrentUser('userId') userId: string,
    @Body() dto: SaveAffiliateDto,
  ) {
    return this.clubService.saveAffiliate(userId, dto);
  }

  @Get('save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Saved Partners',
    description:
      'Retrieve paginated list of saved partners with detailed information',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Saved partners retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getSavedAffiliates(
    @CurrentUser('userId') userId: string,
    @Query() query: GetAffiliatesDto,
  ) {
    return this.clubService.getSavedAffiliates(userId, query);
  }

  @Get('revenue/dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Club Revenue Dashboard',
    description: 'Retrieve club revenue metrics and overview data',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Revenue dashboard retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getRevenueDashboard(@CurrentUser('userId') userId: string) {
    return this.clubService.getRevenueDashboard(userId);
  }

  @Get('revenue/transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Club Revenue Transactions',
    description: 'Retrieve paginated list of revenue transactions (invoices and withdrawals)',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Revenue transactions retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getRevenueTransactions(
    @CurrentUser('userId') userId: string,
    @Query() query: GetRevenueTransactionsDto,
  ) {
    return this.clubService.getRevenueTransactions(userId, query);
  }

  @Post('revenue/withdrawal-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request Withdrawal',
    description: 'Create a new withdrawal request for the club',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Withdrawal request created successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid withdrawal request',
    ErrorResponseDto,
  )
  async requestWithdrawal(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateWithdrawalRequestDto,
  ) {
    return this.clubService.requestWithdrawal(userId, dto);
  }

  @Get('revenue/chart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Club Revenue Chart Data',
    description: 'Retrieve monthly revenue chart data for visualization',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Revenue chart data retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getRevenueChart(
    @CurrentUser('userId') userId: string,
    @Query() query: GetRevenueChartDto,
  ) {
    return this.clubService.getRevenueChart(userId, query);
  }

  @Get('revenue/hire-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Club Hire History',
    description: 'Retrieve paginated list of hire history transactions',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Hire history retrieved successfully')
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized - Invalid or missing token',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  async getHireHistory(
    @CurrentUser('userId') userId: string,
    @Query() query: GetHireHistoryDto,
  ) {
    return this.clubService.getHireHistory(userId, query);
  }
}
