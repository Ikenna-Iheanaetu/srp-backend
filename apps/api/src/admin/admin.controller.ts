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
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { UserTypeGuard } from 'src/common/guards/user-type.guard';
import { UserType as UserTypeDecorator } from 'src/common/decorators/user-type.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { AdminProfileResponseDto } from './dto/responses/profile-repsonse.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateAdminProfileResponseDto } from './dto/responses/update-admin-profile-response.dto';
import { GetCompaniesDto } from '../company/dto/get-companies.dto';
import { CompanyListResponseDto } from '../company/dto/responses/get-company-response.dto';
import { CompanyService } from 'src/company/company.service';
import { ClubService } from 'src/club/club.service';
import { InviteCompanyResponseDto } from 'src/company/dto/responses/invite-comany-response.dto';
import { InviteCompanyDto } from 'src/company/dto/invite-company.dto';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { DeleteCompanyParamsDto } from 'src/company/dto/delete-company-params.dto';
import { DeleteCompanyResponseDto } from 'src/company/dto/responses/delete-company-response.dto';
import { GetClubsResponseDto } from 'src/club/dto/responses/get-clubs-response.dto';
import { GetClubsDto } from 'src/club/dto/get-clubs.dto';
import { InviteClubResponseDto } from 'src/club/dto/responses/invite-club-respponse.dto';
import { InviteClubDto } from 'src/club/dto/invite-club.dto';
import { DeleteClubParamsDto } from 'src/club/dto/delete-club.dto';
import { DeleteClubResponseDto } from 'src/club/dto/responses/delete-club-response.dto';
import { GetHiredPlayersResponseDto } from './dto/responses/hired-players-reponse.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { GetHiredPlayersParamsDto } from './dto/get-hired-players-param.dto';
import { DeletePlayerResponseDto } from 'src/player-supporter/dto/responses/delete-player-response.dto';
import { PlayerSupporterService } from 'src/player-supporter/player-supporter.service';
import { GetAffiliatesResponseDto } from './dto/responses/get-affiliates-responses.dto';
import { GetAffiliatesDto } from './dto/get-affiliate-query.dto';
import { DeleteAffiliateResponseDto } from './dto/responses/delete-affiliates-response.dto';
import { GetUnclaimedAffiliatesResponseDto } from './dto/responses/get-unclaimed-affiliates-invite-responses.dto';
import { GetUnclaimedAffiliatesQueryDto } from './dto/get-unclaimed-affiliates-invite-query.dto';
import { GetUnapprovedAffiliatesQueryDto } from './dto/get-unapproved-affiliates-query.dto';
import { UpdateInviteDto } from './dto/affiliate-invite.dto';
import { UpdateInviteResponseDto } from './dto/responses/update-invite-response.dto';
import { ResendAffiliateInviteResponseDto } from './dto/responses/resend-affiliate-invite-response.dto';
import { GetDashboardMetricsQueryDto } from './dto/get-dashboard-metrics-query.dto';
import { GetDashboardMetricsResponseDto } from './dto/responses/dashboard-metrics-response.dto';
import { GetHireHistoryQueryDto } from './dto/get-hire-history-query.dto';
import { GetHireHistoryResponseDto } from './dto/responses/hire-history-response.dto';
import { GetNewCompaniesQueryDto } from './dto/get-new-companies-query.dto';
import { GetNewCompaniesResponseDto } from './dto/responses/new-companies-response.dto';
import { GetInvoicesQueryDto } from './dto/get-invoices-query.dto';
import { GetInvoicesResponseDto } from './dto/responses/invoices-response.dto';
import { GetInvoiceStatsResponseDto } from './dto/responses/invoice-stats-response.dto';
import { ExportInvoicesQueryDto } from './dto/export-invoices-query.dto';
import { ExportInvoicesResponseDto } from './dto/responses/export-invoices-response.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { GetRequestsQueryDto } from './dto/get-requests-query.dto';
import { GetRequestsResponseDto } from './dto/responses/requests-response.dto';
import { GetRequestDetailsResponseDto } from './dto/responses/request-details-response.dto';
import { GetChatTimelineResponseDto } from './dto/responses/chat-timeline-response.dto';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';
import { GetDashboardResponseDto } from './dto/responses/dashboard-response.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypeDecorator(UserType.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly companyService: CompanyService,
    private readonly clubService: ClubService,
    private readonly playersupporterService: PlayerSupporterService,
  ) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get authenticated admin profile' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Profile fetched successfully',
    AdminProfileResponseDto,
  )
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.adminService.getProfile(userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update admin profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Admin profile update with optional avatar',
    type: UpdateAdminProfileDto,
    required: false,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Super Admin' },
        securityQuestion_question: { type: 'string', example: 'Fav color?' },
        securityQuestion_answer: { type: 'string', example: 'Blue' },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Admin avatar image (jpeg, png, webp, max 2 MB)',
        },
      },
    },
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Admin profile updated successfully',
    UpdateAdminProfileResponseDto,
  )
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @UploadedFile() avatar?: Express.Multer.File,
    @Body() dto?: UpdateAdminProfileDto,
  ) {
    return this.adminService.updateProfile(userId, dto, avatar);
  }

  @Get('companies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List approved companies',
    description:
      'Get paginated list of approved companies with their club affiliations and employee counts',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Companies fetched successfully',
    CompanyListResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getCompanies(@Query() q: GetCompaniesDto) {
    return this.companyService.getCompanies(q);
  }

  @Post('invite-companies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invite companies via email',
    description:
      'Admin endpoint to send invitations to companies to join a club',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Company invitation(s) sent successfully',
    InviteCompanyResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async inviteCompany(@Body() dto: InviteCompanyDto) {
    return this.companyService.inviteCompanies(dto);
  }

  @Delete('company/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete company',
    description: 'Admin endpoint to delete a company and all related data',
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID',
    example: '60f7b3f7c9e77c001f8e6f9a',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Company deleted successfully',
    DeleteCompanyResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Company not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async deleteCompany(@Param() params: DeleteCompanyParamsDto) {
    return this.companyService.deleteCompany(params.id);
  }

  @Get('clubs')
  @ApiOperation({
    summary: 'Get clubs',
    description:
      'Admin endpoint to retrieve clubs with filtering and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in club names',
    example: 'Sports Club',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Clubs fetched successfully',
    GetClubsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getClubs(@Query() query: GetClubsDto) {
    return this.clubService.getClubs(query);
  }

  @Post('invite-clubs')
  @ApiOperation({
    summary: 'Invite clubs via email',
    description: 'Admin endpoint to send invitations to clubs',
  })
  @ApiResponseDecorator(
    HttpStatus.CREATED,
    'Club invitation(s) sent successfully',
    InviteClubResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async inviteClubs(@Body() dto: InviteClubDto) {
    return this.clubService.inviteClubs(dto);
  }

  @Delete('club/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete club',
    description: 'Admin endpoint to delete a club and all related data',
  })
  @ApiParam({
    name: 'id',
    description: 'Club ID',
    example: '60f7b3f7c9e77c001f8e6f9a',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Club deleted successfully',
    DeleteClubResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async deleteClub(@Param() params: DeleteClubParamsDto) {
    return this.clubService.deleteClub(params.id);
  }

  @Get('company/hired/:id')
  @ApiOperation({
    summary: 'Get hired players for a company',
    description: 'Admin endpoint to fetch players hired by a specific company',
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID',
    example: '60f7b3f7c9e77c001f8e6f9a',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Fetched hired players successfully',
    GetHiredPlayersResponseDto,
  )
  async getCompanyHiredPlayers(
    @Param() params: GetHiredPlayersParamsDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.companyService.getCompanyHiredPlayers(
      params.id,
      query.page ? Number(query.page) : undefined,
      query.limit ? Number(query.limit) : undefined,
    );
  }

  @Get('club/hired/:id')
  @ApiOperation({
    summary: 'Get hired players for a club',
    description:
      'Admin endpoint to fetch players hired through a specific club',
  })
  @ApiParam({
    name: 'id',
    description: 'Club ID',
    example: '60f7b3f7c9e77c001f8e6f9a',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Hired players retrieved successfully',
    GetHiredPlayersResponseDto,
  )
  async getClubHiredPlayers(
    @Param() params: GetHiredPlayersParamsDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.clubService.getClubHiredPlayers(
      params.id,
      query.page ? Number(query.page) : undefined,
      query.limit ? Number(query.limit) : undefined,
    );
  }

  @Delete('hire/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a player' })
  @ApiParam({ name: 'id', description: 'Player ID' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Player deleted successfully',
    DeletePlayerResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Player not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async deletePlayer(@Param('id') id: string) {
    return this.playersupporterService.deletePlayer(id);
  }

  @Get('affiliates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get affiliates',
    description:
      'Endpoint to retrieve approved affiliates with filtering and pagination',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Affiliates fetched successfully',
    GetAffiliatesResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getAffiliates(@Query() query: GetAffiliatesDto) {
    return this.adminService.getAffiliates(query);
  }

  @Delete('affiliates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete affiliate',
    description: 'Admin endpoint to delete an affiliate and all related data',
  })
  @ApiParam({
    name: 'id',
    description: 'Affiliate ID',
    example: '68c02dec6759f60fe9213820',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Affiliate deleted successfully',
    DeleteAffiliateResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Affiliate not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async deleteAffiliate(@Param('id') id: string) {
    return this.adminService.deleteAffiliate(id);
  }

  @Get('affiliates/invites/unclaimed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get unclaimed affiliate invites',
    description:
      'Endpoint to retrieve unclaimed affiliate invites with filtering and pagination',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Unclaimed affiliates fetched successfully',
    GetUnclaimedAffiliatesResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getUnclaimedAffiliates(@Query() query: GetUnclaimedAffiliatesQueryDto) {
    return this.adminService.getUnclaimedAffiliates(query);
  }

  @Get('affiliates/invites/unapproved')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get unapproved affiliate invites',
    description:
      'Endpoint to retrieve unapproved affiliate invites with filtering and pagination',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Unapproved affiliates fetched successfully',
    GetUnapprovedAffiliatesQueryDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getUnapprovedAffiliates(
    @Query() query: GetUnapprovedAffiliatesQueryDto,
  ) {
    return this.adminService.getUnapprovedAffiliates(query);
  }

  @Patch('affiliates/invites/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update affiliate invite status' })
  @ApiParam({
    name: 'id',
    description: 'Affiliate ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    description: 'Update invite status',
    type: UpdateInviteDto,
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Invite updated successfully',
    UpdateInviteResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Invite not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async updateInvite(@Param('id') id: string, @Body() dto: UpdateInviteDto) {
    return this.adminService.updateInvite(id, dto);
  }

  @Post('affiliates/invites/resend/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend affiliate invite' })
  @ApiParam({
    name: 'id',
    description: 'Affiliate ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Invite has been resent successfully',
    ResendAffiliateInviteResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Invite not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'This invite has already been claimed',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async resendInvite(@Param('id') id: string) {
    return this.adminService.resendInvite(id);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get combined dashboard data',
    description:
      'Admin endpoint to retrieve all dashboard data (metrics, hire history, and new companies) in a single request',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for metrics (today, yesterday, last_week, last_month, last_year)',
    example: 'last_week',
  })
  @ApiQuery({
    name: 'hireHistoryPage',
    required: false,
    description: 'Page number for hire history',
    example: 1,
  })
  @ApiQuery({
    name: 'hireHistoryLimit',
    required: false,
    description: 'Items per page for hire history',
    example: 5,
  })
  @ApiQuery({
    name: 'newCompaniesPage',
    required: false,
    description: 'Page number for new companies',
    example: 1,
  })
  @ApiQuery({
    name: 'newCompaniesLimit',
    required: false,
    description: 'Items per page for new companies',
    example: 2,
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Dashboard data fetched successfully',
    GetDashboardResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getDashboard(@Query() query: GetDashboardQueryDto) {
    return this.adminService.getDashboard(query);
  }

  @Get('dashboard/metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description:
      'Admin endpoint to retrieve dashboard metrics with period comparison',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for metrics (today, yesterday, last_week, last_month, last_year)',
    example: 'last_week',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Dashboard metrics fetched successfully',
    GetDashboardMetricsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getDashboardMetrics(@Query() query: GetDashboardMetricsQueryDto) {
    return this.adminService.getDashboardMetrics(query);
  }

  @Get('dashboard/hire-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get hire history',
    description:
      'Admin endpoint to retrieve paginated list of all hires with filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by player name, company name, or club name',
    example: 'Alex',
  })
  @ApiQuery({
    name: 'hiredAt',
    required: false,
    description: 'Filter by hire date',
    example: '2023-12-08',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Hire history fetched successfully',
    GetHireHistoryResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getHireHistory(@Query() query: GetHireHistoryQueryDto) {
    return this.adminService.getHireHistory(query);
  }

  @Get('dashboard/new-companies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get new companies',
    description:
      'Admin endpoint to retrieve paginated list of new company signups',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by company name',
    example: 'Elite Match',
  })
  @ApiQuery({
    name: 'signupDate',
    required: false,
    description: 'Filter by signup date',
    example: '2023-12-08',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    example: 'pending',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'New companies fetched successfully',
    GetNewCompaniesResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getNewCompanies(@Query() query: GetNewCompaniesQueryDto) {
    return this.adminService.getNewCompanies(query);
  }

  @Get('invoices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get invoices',
    description:
      'Admin endpoint to retrieve paginated list of invoices with filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by player name, company name, or invoice code',
    example: 'Alex',
  })
  @ApiQuery({
    name: 'invoiceDate',
    required: false,
    description: 'Filter by invoice date',
    example: '2023-12-08',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by invoice status',
    example: 'paid',
  })
  @ApiQuery({
    name: 'tab',
    required: false,
    description: 'Filter by tab (company or club)',
    example: 'company',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Invoices fetched successfully',
    GetInvoicesResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getInvoices(@Query() query: GetInvoicesQueryDto) {
    return this.adminService.getInvoices(query);
  }

  @Get('invoices/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get invoice statistics',
    description:
      'Admin endpoint to retrieve invoice statistics (paid/pending counts)',
  })
  @ApiQuery({
    name: 'tab',
    required: false,
    description: 'Filter by tab (company or club)',
    example: 'company',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Invoice statistics fetched successfully',
    GetInvoiceStatsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getInvoiceStats(@Query() query: GetInvoicesQueryDto) {
    return this.adminService.getInvoiceStats(query.tab);
  }

  @Get('invoices/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export invoices',
    description:
      'Admin endpoint to export all invoices (without pagination) for download',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by player name, company name, or invoice code',
    example: 'Alex',
  })
  @ApiQuery({
    name: 'invoiceDate',
    required: false,
    description: 'Filter by invoice date',
    example: '2023-12-08',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by invoice status',
    example: 'paid',
  })
  @ApiQuery({
    name: 'tab',
    required: false,
    description: 'Filter by tab (company or club)',
    example: 'company',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Export format (csv or excel)',
    example: 'csv',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Invoices exported successfully',
    ExportInvoicesResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async exportInvoices(@Query() query: ExportInvoicesQueryDto) {
    return this.adminService.exportInvoices(query);
  }

  @Patch('invoices/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update invoice status',
    description: 'Admin endpoint to update the status of an invoice',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Invoice ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Invoice status updated successfully',
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Invoice not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async updateInvoiceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.adminService.updateInvoiceStatus(id, dto.status);
  }

  @Get('requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all hire requests',
    description:
      'Admin endpoint to fetch all hire requests between players and companies with pagination and filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by request ID, initiator name, or recipient name',
    example: 'MSG_1039',
  })
  @ApiQuery({
    name: 'requestDate',
    required: false,
    description: 'Filter by request date',
    example: '2023-12-08',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by request status',
    example: 'pending',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Requests fetched successfully',
    GetRequestsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getRequests(@Query() query: GetRequestsQueryDto) {
    return this.adminService.getRequests(query);
  }

  @Get('requests/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get request details',
    description:
      'Admin endpoint to fetch detailed information about a specific hire request including event timeline',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Request ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Request details fetched successfully',
    GetRequestDetailsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Request not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getRequestDetails(@Param('id') id: string) {
    return this.adminService.getRequestDetails(id);
  }

  @Get('chat/:chatId/timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get chat timeline',
    description: 'Admin endpoint to fetch timeline events for a specific chat',
  })
  @ApiParam({
    name: 'chatId',
    required: true,
    description: 'Chat ID',
    example: '64af1f77bcf86cd799439011',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Chat timeline fetched successfully',
    GetChatTimelineResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Chat not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ErrorResponseDto,
  )
  async getChatTimeline(@Param('chatId') chatId: string) {
    return this.adminService.getChatTimeline(chatId);
  }
}
