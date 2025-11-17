import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { CompanyService } from './company.service';
import { CompanyPublicProfileResponseDto } from './dto/responses/company-public-profile-response.dto';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Company Public')
@Controller('profile/company')
export class CompanyPublicController {
  constructor(private readonly companyService: CompanyService) {}

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public company profile by id' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Profile fetched successfully',
    CompanyPublicProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Company not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch public profile',
    ErrorResponseDto,
  )
  async getPublicProfile(
    @Param('id') id: string,
    @CurrentUser('profileId') profileId?: string,
    @CurrentUser('userType') userType?: string,
  ) {
    return this.companyService.getPublicProfile(id, profileId, userType);
  }
}

