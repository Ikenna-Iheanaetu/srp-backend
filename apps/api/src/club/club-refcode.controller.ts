import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { ClubService } from './club.service';

@ApiTags('Club Public')
@Controller('get-club')
export class ClubRefCodeController {
  constructor(private readonly clubService: ClubService) {}

  @Get(':refCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get club by reference code' })
  @ApiParam({
    name: 'refCode',
    description: 'Club reference code',
    example: 'ABC123',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Club fetched successfully', Object)
  @ApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Club not found',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to fetch club',
    ErrorResponseDto,
  )
  async getClubByRefCode(@Param('refCode') refCode: string) {
    return this.clubService.getClubByRefCode(refCode);
  }
}
