import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PlayerSupporterService } from './player-supporter.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserTypeGuard } from 'src/common/guards/user-type.guard';
import { UserType } from '@prisma/client';
import { UserType as UserTypeDecorator } from 'src/common/decorators/user-type.decorator';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PlayerSupporterProfileResponseDto } from './dto/responses/player-supporter-profile-response.dto';
import {
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { CompleteProfileResponseDto } from './dto/responses/complete-profile-response.dto';
import { UpdateProfileResponseDto } from './dto/responses/update-profile-responses.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompanyService } from '../company/company.service';
import { GetJobsByCompanyParamsDto } from '../company/dto/get-jobs-by-company-param.dto';
import { GetJobsByCompanyQueryDto } from '../company/dto/get-jobs-by-company-query.dto';
import { GetJobsByCompanyResponseDto } from '../company/dto/responses/get-jobs-by-company-response.dto';
import { GetJobsByPlayerDto } from './dto/get-jobs-by-player.dto';
import { GetJobsByPlayerResponseDto } from './dto/responses/get-jobs-by-player-response.dto';
import { GetJobsTrackingDto } from './dto/get-jobs-tracking.dto';
import { GetJobsTrackingResponseDto } from './dto/responses/get-jobs-tracking-response.dto';
import { ApplyForJobDto } from './dto/apply-for-job.dto';
import { ApplyForJobResponseDto } from './dto/responses/apply-for-job-response.dto';
import { GetSingleJobResponseDto } from './dto/responses/get-single-job-response.dto';
import { BookmarkToggleResponseDto } from './dto/responses/bookmark-toggle-response.dto';
import { DashboardResponseDto } from './dto/responses/dashboard-response.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { JOB_APPLICATION_FILE_FIELDS, PLAYER_FILE_FIELDS } from './constants/file-fields.constants';
import { JobApplicationFiles, PlayerFiles } from './types/files.types';
import { FileProcessorUtil } from './utils/file-processor.util';
import { GetCompaniesForPlayerResponseDto } from './dto/responses/get-companies-for-player.dto';
import { GetCompaniesForPlayerQueryDto } from './dto/get-companies-for-player-query.dto';

@ApiTags('Player Supporter')
@Controller(['player', 'supporter'])
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypeDecorator(UserType.PLAYER, UserType.SUPPORTER)
export class PlayerSupporterController {
  constructor(
    private readonly playerSupporterService: PlayerSupporterService,
    private readonly companyService: CompanyService,
  ) {}

  @Get('companies')
  @ApiOperation({
    summary: 'Get a paginated list of companies.',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Companies fetched successfully',
    GetCompaniesForPlayerResponseDto,
  )
  async getCompanies(
    @Query() query: GetCompaniesForPlayerQueryDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.playerSupporterService.getCompanies(query, userId);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get player profile',
    description: 'Retrieve complete player profile with club affiliation',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Player profile retrieved successfully',
    PlayerSupporterProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Profile not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to retrieve profile. Please try again later.',
    ErrorResponseDto,
  )
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.playerSupporterService.getProfile(userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor(PLAYER_FILE_FIELDS))
  @ApiOperation({
    summary: 'Complete player profile step by step',
    description: 'Multi-step player profile completion with file uploads',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Player profile completion data with optional files',
    type: CompleteProfileDto,
    schema: {
      type: 'object',
      properties: {
        step: { type: 'number', example: 1, minimum: 1, maximum: 4 },
        // Step 1
        about: { type: 'string', example: 'Passionate footballer' },
        country: { type: 'string', example: 'USA' },
        address: { type: 'string', example: '123 Main St' },
        shirtNumber: { type: 'number', example: 10 },
        birthYear: { type: 'number', example: 1995 },
        sportsHistory: { type: 'string', example: 'Played since 2010' },
        industry: { type: 'string', example: 'Technology' },
        yearsOfExperience: { type: 'number', example: 5 },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image (jpeg, png, webp, max 2 MB)',
        },
        // Step 2
        'workLocations[]': { type: 'array', items: { type: 'string' } },
        'employmentType[primary]': { type: 'string', example: 'full_time' },
        'employmentType[secondary][]': {
          type: 'array',
          items: { type: 'string' },
        },
        'jobRole[primary]': { type: 'string', example: 'Software Engineer' },
        'jobRole[secondary][]': { type: 'array', items: { type: 'string' } },
        // Step 3
        'traits[]': { type: 'array', items: { type: 'string' } },
        'skills[]': { type: 'array', items: { type: 'string' } },
        'certifications[]': { type: 'array', items: { type: 'string' } },
        workAvailability: { type: 'boolean', example: true },
        resume: {
          type: 'string',
          format: 'binary',
          description: 'Resume file (pdf, doc, docx, max 5 MB)',
        },
        certifications0: { type: 'string', format: 'binary' },
        certifications1: { type: 'string', format: 'binary' },
        certifications2: { type: 'string', format: 'binary' },
        certifications3: { type: 'string', format: 'binary' },
        certifications4: { type: 'string', format: 'binary' },
        // Step 4
        'securityQuestion[question]': {
          type: 'string',
          example: 'Favorite color?',
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
    'Player not found',
    ErrorResponseDto,
  )
  async completeProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: CompleteProfileDto,
    @UploadedFiles()
    files?: PlayerFiles,
  ) {
    const processedFiles = FileProcessorUtil.extractFiles(files);
    return this.playerSupporterService.completeProfile(
      userId,
      dto,
      processedFiles,
    );
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor(PLAYER_FILE_FIELDS))
  @ApiOperation({
    summary: 'Update player profile',
    description: 'Update player profile information with optional file uploads',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Player profile update data with optional files',
    type: UpdateProfileDto,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        about: { type: 'string', example: 'Passionate footballer' },
        country: { type: 'string', example: 'USA' },
        address: { type: 'string', example: '123 Main St' },
        workAvailability: { type: 'boolean', example: true },
        yearsOfExperience: { type: 'number', example: 5 },
        shirtNumber: { type: 'number', example: 10 },
        birthYear: { type: 'number', example: 1995 },
        sportsHistory: { type: 'string', example: 'Played since 2010' },
        industry: { type: 'string', example: 'Technology' },
        'workLocations[]': { type: 'array', items: { type: 'string' } },
        'employmentType[primary]': { type: 'string', example: 'full_time' },
        'employmentType[secondary][]': {
          type: 'array',
          items: { type: 'string' },
        },
        'jobRole[primary]': { type: 'string', example: 'Software Engineer' },
        'jobRole[secondary][]': { type: 'array', items: { type: 'string' } },
        'traits[]': { type: 'array', items: { type: 'string' } },
        'skills[]': { type: 'array', items: { type: 'string' } },
        'experiences[]': { type: 'array', items: { type: 'string' } },
        'responsibilities[]': {
          type: 'array',
          items: { type: 'string' },
          maxItems: 7,
        },
        'certifications[]': { type: 'array', items: { type: 'string' } },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image',
        },
        banner: {
          type: 'string',
          format: 'binary',
          description: 'Banner image',
        },
        resume: {
          type: 'string',
          format: 'binary',
          description: 'Resume file',
        },
        certifications0: { type: 'string', format: 'binary' },
        certifications1: { type: 'string', format: 'binary' },
        certifications2: { type: 'string', format: 'binary' },
        certifications3: { type: 'string', format: 'binary' },
        certifications4: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Profile updated successfully',
    UpdateProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Player not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid input data',
    ErrorResponseDto,
  )
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFiles() files?: PlayerFiles,
  ) {
    const processedFiles = FileProcessorUtil.extractFiles(files);

    return this.playerSupporterService.updateProfile(
      userId,
      dto,
      processedFiles,
    );
  }

  @Get('company/:id/jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get jobs by company for players',
    description:
      'Retrieve a paginated list of active jobs for a specific company',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Jobs fetched successfully',
    GetJobsByCompanyResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Company not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch jobs. Please try again later.',
    ErrorResponseDto,
  )
  async getJobsByCompany(
    @Param() params: GetJobsByCompanyParamsDto,
    @Query() query: GetJobsByCompanyQueryDto,
  ) {
    return this.companyService.getJobsByCompany(params.id, query);
  }

  @Get('jobs')
  @UseGuards(AuthGuard, UserTypeGuard)
  @UserTypeDecorator(UserType.PLAYER)
  @ApiOperation({ summary: 'Get all jobs for a player with filtering' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Jobs fetched successfully',
    GetJobsByPlayerResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid request parameters',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Player not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch jobs. Please try again later.',
    ErrorResponseDto,
  )
  async getAllJobsByPlayer(
    @CurrentUser('profileId') userProfileId: string,
    @Query() query: GetJobsByPlayerDto,
  ) {
    return this.playerSupporterService.getAllJobsByPlayer(userProfileId, query);
  }

  @Get('jobs/tracking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get job tracking data for a player',
    description:
      'Retrieve jobs that the player has applied to with their application status',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Job tracking data fetched successfully',
    GetJobsTrackingResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Player not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch job tracking data. Please try again later.',
    ErrorResponseDto,
  )
  async getJobsTrackingByPlayer(
    @CurrentUser('profileId') userProfileId: string,
    @Query() query: GetJobsTrackingDto,
  ) {
    return this.playerSupporterService.getJobsTrackingByPlayer(
      userProfileId,
      query,
    );
  }

  @Get('jobs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single job for player' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Job fetched successfully',
    GetSingleJobResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.NOT_FOUND, 'Job not found', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch job',
    ErrorResponseDto,
  )
  async getJobById(
    @Param('id') jobId: string,
    @CurrentUser('profileId') playerId: string,
  ) {
    return this.playerSupporterService.getJobByIdForPlayer(playerId, jobId);
  }

  @Post('jobs/bookmarks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle bookmark for a job' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Bookmark toggled',
    BookmarkToggleResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Job or Player not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to update bookmark',
    ErrorResponseDto,
  )
  async toggleBookmark(
    @Param('id') jobId: string,
    @CurrentUser('profileId') playerId: string,
  ) {
    return this.playerSupporterService.toggleJobBookmark(playerId, jobId);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get player dashboard data' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Dashboard fetched successfully',
    DashboardResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch dashboard',
    ErrorResponseDto,
  )
  async getDashboard(@CurrentUser('profileId') playerId: string) {
    return this.playerSupporterService.getDashboard(playerId);
  }

  @Post('jobs/apply/:id')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileFieldsInterceptor(JOB_APPLICATION_FILE_FIELDS))
  @ApiOperation({ summary: 'Apply for a job' })
  @ApiConsumes('multipart/form-data')
  @ApiResponseDecorator(
    HttpStatus.CREATED,
    'Application created successfully',
    ApplyForJobResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid input data',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.NOT_FOUND, 'Job not found', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'You have already applied',
    ErrorResponseDto,
  )
  async applyForJob(
    @Param('id') jobId: string,
    @Body() dto: ApplyForJobDto,
    @UploadedFiles()
    files: JobApplicationFiles,
    @CurrentUser('userId') userId: string,
  ) {
    const processedFiles = FileProcessorUtil.extractJobApplicationFiles(files);

    return this.playerSupporterService.applyForJob(jobId, dto, processedFiles, userId);
  }
}
