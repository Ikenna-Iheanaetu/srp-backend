import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { ClubService } from './club.service';
import { GetClubsDto } from './dto/get-clubs.dto';
import { GetClubsResponseDto } from './dto/responses/get-clubs-response.dto';

@ApiTags('Club Public')
@Controller('profile/club')
export class ClubPublicController {
  constructor(private readonly clubService: ClubService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public clubs with filters' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Clubs fetched successfully',
    GetClubsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch clubs',
    ErrorResponseDto,
  )
  async getClubs(@Query() query: GetClubsDto) {
    return this.clubService.getClubs(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public club profile by id' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Club profile fetched successfully',
    GetClubsResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch club profile',
    ErrorResponseDto,
  )
  async getPublicClubProfile(@Param('id') id: string) {
    return this.clubService.getPublicClubProfile(id);
  }
}
