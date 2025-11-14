import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatsService } from './services/chats.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserTypeGuard } from '../common/guards/user-type.guard';
import { UserType as UserTypeDecorator } from '../common/decorators/user-type.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { ApiResponseDecorator } from '../common/decorators/api-response.decorator';
import { CreateChatDto } from './dto/create-chat.dto';
import { GetChatsQueryDto } from './dto/get-chats-query.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import {
  CreateChatResponseDto,
  AcceptChatResponseDto,
  DeclineChatResponseDto,
  EndChatResponseDto,
  ExtendChatResponseDto,
  ChatDto,
  ChatListItemDto,
  MessageDto,
} from './dto/chat-response.dto';
import { RequestUploadUrlDto, UploadUrlResponseDto } from './dto/request-upload-url.dto';
import { UserType } from '@prisma/client';
import { MinioService } from '../utils/minio.utils';
import { GetSuggestedProfilesQueryDto } from './dto/get-suggested-profiles-query.dto';
import { GetSuggestedProfilesForUserParamsDto } from './dto/get-suggested-profiles-for-user-params.dto';
import { GetBulkSuggestedProfilesDto } from './dto/get-bulk-suggested-profiles.dto';

@ApiTags('Chats')
@Controller({ path: 'chats', version: '1' })
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypeDecorator(UserType.COMPANY, UserType.PLAYER, UserType.SUPPORTER)
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly minioService: MinioService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat with initial message' })
  @ApiResponseDecorator(
    HttpStatus.CREATED,
    'Chat created successfully',
    CreateChatResponseDto,
  )
  async createChat(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateChatDto,
  ) {
    return await this.chatsService.createChat(
      user.userId,
      user.userType as UserType,
      dto,
    );
  }

  @Post('attachments/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request presigned URLs for uploading message attachments (batch upload)',
    description: 'Generate presigned URLs for uploading 1-10 files at once'
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Upload URLs generated successfully',
    UploadUrlResponseDto,
  )
  async requestUploadUrl(
    @CurrentUser('userId') userId: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    // Generate presigned URLs for all files
    const uploadPromises = dto.fileNames.map((fileName) =>
      this.minioService.generatePresignedUploadUrl(
        userId,
        'message-attachment',
        fileName,
      ),
    );

    const results = await Promise.all(uploadPromises);

    // Format response
    const files = results.map((result, index) => ({
      fileName: dto.fileNames[index],
      uploadUrl: result.uploadUrl,
      fileKey: result.fileKey,
      publicUrl: result.publicUrl,
    }));

    return {
      message: `Upload URLs generated successfully for ${files.length} file(s)`,
      data: {
        files,
        expirySeconds: 15 * 60, // 15 minutes
      },
    };
  }

  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a pending chat' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Chat accepted successfully',
    AcceptChatResponseDto,
  )
  async acceptChat(
    @CurrentUser('userId') userId: string,
    @Param('id') chatId: string,
  ) {
    return await this.chatsService.acceptChat(
      chatId,
      userId,
    );
  }

  @Patch(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a pending chat' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Chat declined successfully',
    DeclineChatResponseDto,
  )
  async declineChat(
    @CurrentUser('userId') userId: string,
    @Param('id') chatId: string,
  ) {
    return await this.chatsService.declineChat(
      chatId,
      userId,
    );
  }

  @Patch(':id/extend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extend chat by 3 days' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Chat extended successfully',
    ExtendChatResponseDto,
  )
  async extendChat(
    @CurrentUser('userId') userId: string,
    @Param('id') chatId: string,
  ) {
    return await this.chatsService.extendChat(
      chatId,
      userId,
    );
  }

  @Patch(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End an active chat' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Chat ended successfully',
    EndChatResponseDto,
  )
  async endChat(
    @CurrentUser('userId') userId: string,
    @Param('id') chatId: string,
  ) {
    return await this.chatsService.endChat(
      chatId,
      userId,
    );
  }

  @Get('unattended-count')
  @ApiOperation({ summary: 'Get count of unattended chat requests' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Unattended count retrieved successfully',
  )
  async getUnattendedCount(@CurrentUser('userId') userId: string) {
    return await this.chatsService.getUnattendedCount(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for current user' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Chats retrieved successfully',
    ChatListItemDto,
  )
  async getChats(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetChatsQueryDto,
  ) {
    return await this.chatsService.getChats(
      user.userId,
      query.status,
      query.search,
      query.page,
      query.limit,
    );
  }

  @Get('suggested')
  @ApiOperation({ summary: 'Get suggested profiles to message' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Suggested profiles retrieved successfully',
    ChatListItemDto,
  )
  async getSuggestedProfiles(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetSuggestedProfilesQueryDto,
  ) {
    return await this.chatsService.getSuggestedProfiles(
      user.userId,
      user.userType as UserType,
      user.profileId,
      query.search,
      query.page,
      query.limit,
    );
  }

  @Get('suggested/:id')
  @ApiOperation({ summary: 'Get a single suggested profile by ID' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Suggested profile retrieved successfully',
    ChatListItemDto, // The response will be a single object of this type
  )
  async getSuggestedProfileById(
    @CurrentUser() user: CurrentUserData,
    @Param() params: GetSuggestedProfilesForUserParamsDto,
  ) {
    return await this.chatsService.getSuggestedProfileById(
      user.userId,
      params.id,
    );
  }

  @Post('suggested/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get multiple suggested profiles by IDs (bulk operation)' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Bulk suggested profiles retrieved successfully',
    ChatListItemDto,
  )
  async getBulkSuggestedProfiles(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: GetBulkSuggestedProfilesDto,
  ) {
    return await this.chatsService.getBulkSuggestedProfilesById(
      user.userId,
      user.userType as UserType,
      dto.ids,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific chat' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Chat retrieved successfully',
    ChatDto,
  )
  async getChat(
    @CurrentUser('userId') userId: string,
    @Param('id') chatId: string,
  ) {
    return await this.chatsService.getChatById(
      chatId,
      userId,
    );
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Messages retrieved successfully',
    MessageDto,
  )
  async getMessages(
    @CurrentUser('userId') userId: string,
    @Param('id') chatId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return await this.chatsService.getMessages(
      chatId,
      userId,
      query.page,
      query.limit,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete chat (soft delete from user view)' })
  async deleteChat(
    @CurrentUser('userId') userId: string,
    @Param('id') chatId: string,
  ) {
    return await this.chatsService.deleteChat(
      chatId,
      userId,
    );
  }
}
