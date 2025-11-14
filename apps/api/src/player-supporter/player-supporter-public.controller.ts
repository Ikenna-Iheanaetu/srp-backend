import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { PlayerSupporterService } from './player-supporter.service';
import { GetPublicPlayersDto } from './dto/get-public-players.dto';
import { GetPublicPlayersResponseDto } from './dto/responses/get-public-players-response.dto';
import { GetPublicPlayersListResponseDto } from './dto/responses/get-public-players-list-response.dto';
import { PublicProfileResponseDto } from './dto/responses/public-profile-response.dto';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Player Supporter Public')
@Controller(['profile/player', 'profile/supporter'])
export class PlayerSupporterPublicController {
  constructor(
    private readonly playerSupporterService: PlayerSupporterService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public players with filters' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Players fetched successfully',
    GetPublicPlayersResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch players',
    ErrorResponseDto,
  )
  async getPlayers(@Query() query: GetPublicPlayersDto) {
    return this.playerSupporterService.getPublicPlayers(query);
  }

  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public players list (names only)' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Players list fetched successfully',
    GetPublicPlayersListResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch players list',
    ErrorResponseDto,
  )
  async getPlayersList(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.playerSupporterService.getPublicPlayersList({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public player profile by id' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Profile fetched successfully',
    PublicProfileResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Player not found',
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
    return this.playerSupporterService.getPublicProfile(
      id,
      profileId,
      userType,
    );
  }
}
