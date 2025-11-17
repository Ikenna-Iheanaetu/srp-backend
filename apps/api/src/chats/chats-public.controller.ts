import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatsService } from './services/chats.service';
import {
  ConfirmHireStatusDto,
  ConfirmHireStatusResponseDto
} from './dto/confirm-hire-status.dto';

@ApiTags('Chats Public')
@Controller('chats')
export class ChatsPublicController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('hire-confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm player hire status after chat completion',
    description: 'Public endpoint for players to confirm whether they were hired after a chat ended or expired. Requires a valid JWT token from the email link.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hire status confirmed successfully',
    type: ConfirmHireStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or chat state',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Token data does not match request or participants',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat not found',
  })
  async confirmHireStatus(
    @Body() dto: ConfirmHireStatusDto,
  ) {
    return await this.chatsService.confirmHireStatus(dto);
  }
}
