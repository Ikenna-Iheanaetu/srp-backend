import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { ClubService } from './club.service';
import { GetPublicClubsDto } from './dto/get-public-clubs.dto';
import { GetPublicClubsResponseDto } from './dto/responses/get-public-clubs-response.dto';

@ApiTags('Club List')
@Controller('clubs')
export class ClubListController {
  constructor(private readonly clubService: ClubService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public clubs with pagination' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Clubs fetched successfully',
    GetPublicClubsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch clubs',
    ErrorResponseDto,
  )
  async getPublicClubs(@Query() query: GetPublicClubsDto) {
    return this.clubService.getPublicClubs(query);
  }
}
