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
import { CompanyService } from './company.service';
import { COMPANY_FILE_FIELDS } from './constants/file-fields.constants';
import { CompanyFiles } from './types/files.types';
import { FileProcessorUtil } from './utils/file-processor.util';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserTypeGuard } from 'src/common/guards/user-type.guard';
import { UserType as UserTypeDecorator } from 'src/common/decorators/user-type.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from 'src/common/decorators/current-user.decorator';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UserType } from '@prisma/client';

// DTOs
import { CompanyCompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  ShortlistPlayerDto,
  GetShortlistedPlayersQueryDto,
  GetHiredPlayersQueryDto,
} from './dto/shortlist-player.dto';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';
import { GetHiredJobsQueryDto } from './dto/get-hired-jobs-query.dto';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PostPartnerAnswersDto } from './dto/questionnaire.dto';
import { GetJobsWithShortlistedQueryDto } from './dto/get-jobs-with-shortlisted-query.dto';

// Response DTOs
import {
  CompanyProfileResponseDto,
  CompleteProfileResponseDto,
  UpdateProfileResponseDto,
} from './dto/responses/company-profile-response.dto';
import { DashboardResponseDto } from './dto/responses/dashboard-response.dto';
import {
  ShortlistPlayerResponseDto,
  RemovePlayerResponseDto,
  JobsWithShortlistedResponseDto,
  ShortlistedPlayersResponseDto,
  HireCandidateResponseDto,
  UnhireCandidateResponseDto,
  RemoveAllShortlistedResponseDto,
} from './dto/responses/shortlist-response.dto';
import {
  JobResponseDto,
  JobsResponseDto,
  DeleteJobResponseDto,
} from './dto/responses/job-response.dto';
import {
  PartnerQuestionsResponseDto,
  PartnerAnswerResponseDto,
} from './dto/responses/questionnaire-response.dto';
import { PlayersResponseDto } from './dto/responses/players-response.dto';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { RemoveShortlistedPlayerDto } from './dto/remove-shortlisted-player.dto';
import { HireCandidateDto } from './dto/hire-and-unhire-candidate.dto';

@ApiTags('Company')
@Controller('company')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypeDecorator(UserType.COMPANY)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get company profile' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Profile fetched successfully',
    CompanyProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Company not found',
    ErrorResponseDto,
  )
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return await this.companyService.getProfile(user.profileId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete company profile (onboarding)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor(COMPANY_FILE_FIELDS))
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Profile updated successfully',
    CompleteProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid step or data',
    ErrorResponseDto,
  )
  async completeProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CompanyCompleteProfileDto,
    @UploadedFiles() files?: CompanyFiles,
  ) {
    const processedFiles = FileProcessorUtil.extractFiles(files);
    return await this.companyService.completeProfile(
      user.profileId,
      dto,
      processedFiles,
    );
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update company profile' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor(COMPANY_FILE_FIELDS))
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Profile updated successfully',
    UpdateProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Company not found',
    ErrorResponseDto,
  )
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateProfileDto,
    @UploadedFiles() files?: CompanyFiles,
  ) {
    const processedFiles = FileProcessorUtil.extractFiles(files);
    return await this.companyService.updateProfile(
      user.profileId,
      dto,
      processedFiles,
    );
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get company dashboard data' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Dashboard data fetched successfully',
    DashboardResponseDto,
  )
  async getDashboard(@CurrentUser() user: CurrentUserData) {
    return await this.companyService.getDashboard(user.profileId);
  }

  @Get('jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all company jobs' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Jobs fetched successfully',
    JobsResponseDto,
  )
  async getAllJobs(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetJobsQueryDto,
  ) {
    return await this.companyService.getAllJobs(user.profileId, query);
  }

  @Post('jobs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponseDecorator(
    HttpStatus.CREATED,
    'Job created successfully',
    JobResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid job data',
    ErrorResponseDto,
  )
  async createJob(
    @CurrentUser('profileId') userProfileId: string,
    @Body() dto: CreateJobDto,
  ) {
    return await this.companyService.createJob(userProfileId, dto);
  }

  @Get('jobs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Job fetched successfully',
    JobResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.NOT_FOUND, 'Job not found', ErrorResponseDto)
  async getJobById(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return await this.companyService.getJobById(user.profileId, id);
  }

  @Patch('jobs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Job updated successfully',
    JobResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.NOT_FOUND, 'Job not found', ErrorResponseDto)
  async updateJob(
    @CurrentUser('profileId') userProfileId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return await this.companyService.updateJob(userProfileId, id, dto);
  }

  @Delete('jobs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Job deleted successfully',
    DeleteJobResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.NOT_FOUND, 'Job not found', ErrorResponseDto)
  async deleteJob(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return await this.companyService.deleteJob(user.profileId, id);
  }

  // Questionnaire endpoints (partner)
  @Get('questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get partner questionnaire questions' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Questions fetched successfully',
    PartnerQuestionsResponseDto,
  )
  async getPartnerQuestions() {
    return await this.companyService.getPartnerQuestions();
  }

  @Post('answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit partner questionnaire answers' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Submitted successfully',
    PartnerAnswerResponseDto,
  )
  async postPartnerAnswers(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: PostPartnerAnswersDto,
  ) {
    return await this.companyService.postPartnerAnswers(user.profileId, dto);
  }

  @Post('shortlist')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Shortlist a candidate for jobs' })
  @ApiResponseDecorator(
    HttpStatus.CREATED,
    'Candidate shortlisted successfully',
    ShortlistPlayerResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid request data',
    ErrorResponseDto,
  )
  async shortlistPlayer(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ShortlistPlayerDto,
  ) {
    return await this.companyService.shortlistPlayer(user.profileId, dto);
  }

  @Delete('shortlist/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove candidate from shortlist' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Candidate removed from shortlist successfully',
    RemovePlayerResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid request data',
    ErrorResponseDto,
  )
  async removePlayer(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RemoveShortlistedPlayerDto,
  ) {
    return await this.companyService.removeShortlistedPlayer(
      user.profileId,
      dto,
    );
  }

  @Get('shortlisted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get jobs with shortlisted players' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Jobs with shortlisted players fetched successfully',
    JobsWithShortlistedResponseDto,
  )
  async getJobsWithShortlistedPlayers(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetJobsWithShortlistedQueryDto,
  ) {
    return await this.companyService.getJobsWithShortlistedPlayers(
      user.profileId,
      query,
    );
  }

  @Get('shortlisted/:job')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get shortlisted players for a specific job' })
  @ApiParam({ name: 'job', description: 'Job ID' })
  @ApiQuery({ name: 'search', required: false, example: 'John Doe' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Shortlisted players fetched successfully',
    ShortlistedPlayersResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Job does not exist',
    ErrorResponseDto,
  )
  async getShortlistedPlayers(
    @CurrentUser() user: CurrentUserData,
    @Param('job') jobId: string,
    @Query() query: GetShortlistedPlayersQueryDto,
  ) {
    return await this.companyService.getShortlistedPlayers(
      user.profileId,
      jobId,
      query,
    );
  }

  @Delete('shortlisted/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove all shortlisted candidates from a job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'All shortlisted candidates removed successfully',
    RemoveAllShortlistedResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.NOT_FOUND, 'Job not found', ErrorResponseDto)
  async removeAllShortlistedUnderJob(
    @CurrentUser() user: CurrentUserData,
    @Param('id') jobId: string,
  ) {
    return await this.companyService.removeAllShortlistedUnderJob(
      user.profileId,
      jobId,
    );
  }

  @Post('hire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hire a candidate' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Candidate hired successfully',
    HireCandidateResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid request or candidate not shortlisted',
    ErrorResponseDto,
  )
  async hireCandidate(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: HireCandidateDto,
  ) {
    return await this.companyService.hireCandidate(user.profileId, dto);
  }

  @Post('hire/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unhire a candidate' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Candidate unhired successfully',
    UnhireCandidateResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Invalid request or candidate not hired',
    ErrorResponseDto,
  )
  async unhireCandidate(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: HireCandidateDto,
  ) {
    return await this.companyService.unhireCandidate(user.profileId, dto);
  }

  @Get('hired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get jobs with hired players' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Jobs with hired players fetched successfully',
    JobsWithShortlistedResponseDto,
  )
  async getJobsWithHiredPlayers(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetHiredJobsQueryDto,
  ) {
    return await this.companyService.getJobsWithHiredPlayers(
      user.profileId,
      query,
    );
  }

  @Get('hired/:job')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get hired players for a specific job' })
  @ApiParam({ name: 'job', description: 'Job ID' })
  @ApiQuery({ name: 'search', required: false, example: 'John Doe' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Hired players fetched successfully',
    ShortlistedPlayersResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Job does not exist',
    ErrorResponseDto,
  )
  async getHiredPlayers(
    @CurrentUser() user: CurrentUserData,
    @Param('job') jobId: string,
    @Query() query: GetHiredPlayersQueryDto,
  ) {
    return await this.companyService.getHiredPlayers(
      user.profileId,
      jobId,
      query,
    );
  }

  @Delete('hired/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove all hired candidates from a job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'All hired candidates removed successfully',
    RemoveAllShortlistedResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.NOT_FOUND, 'Job not found', ErrorResponseDto)
  async removeAllHiredUnderJob(
    @CurrentUser() user: CurrentUserData,
    @Param('id') jobId: string,
  ) {
    return await this.companyService.removeAllHiredUnderJob(
      user.profileId,
      jobId,
    );
  }

  @Get('players')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get players/supporters available for recruitment' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'John Doe' })
  @ApiQuery({ name: 'regions', required: false, example: ['North America'] })
  @ApiQuery({
    name: 'candidates',
    required: false,
    example: ['player', 'supporter'],
  })
  @ApiQuery({ name: 'workTypes', required: false, example: ['full-time'] })
  @ApiQuery({ name: 'clubTypes', required: false, example: ['professional'] })
  @ApiQuery({ name: 'clubs', required: false, example: ['club1'] })
  @ApiQuery({
    name: 'industry',
    required: false,
    example: ['Sports Technology'],
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Players retrieved successfully',
    PlayersResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch players',
    ErrorResponseDto,
  )
  async getPlayers(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetPlayersQueryDto,
  ) {
    return await this.companyService.getPlayers(user.profileId, user.userId, query);
  }
}
