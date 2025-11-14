// Mock the gateway module before importing
jest.mock('../chats.gateway', () => ({
  ChatsGateway: class MockChatsGateway {
    notifyChatExtended = jest.fn();
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatCacheService } from './chat-cache.service';
import { getQueueToken } from '@nestjs/bull';
import { forwardRef } from '@nestjs/common';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ChatStatus,
  UserType,
  UserStatus,
  ChatEventType,
  RequestStatus,
  RequestExtendEventDays,
} from '@prisma/client';
import { Queue } from 'bull';

const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
  chat: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  message: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  chatEvent: {
    create: jest.fn(),
  },
  hireRequest: {
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  player: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  company: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const cacheMock = {
  cacheChat: jest.fn(),
  getCachedChat: jest.fn(),
  updateChatStatus: jest.fn(),
  invalidateChatMetadata: jest.fn(),
  incrementUnreadCount: jest.fn(),
  getAllUnreadCounts: jest.fn(),
  getDeletedChats: jest.fn(),
  getDeletedAt: jest.fn(),
  markAsDeleted: jest.fn(),
  resetUnreadCount: jest.fn(),
  removeFromDeleted: jest.fn(),
  checkRateLimit: jest.fn(),
  addMessageToCache: jest.fn(),
  updateMessageInCache: jest.fn(),
  isParticipantCached: jest.fn(),
  cacheParticipantVerification: jest.fn(),
  cacheChatMetadata: jest.fn(),
};

const gatewayMock = {
  notifyChatExtended: jest.fn(),
};

const queueMock = {
  add: jest.fn(),
  getJob: jest.fn(),
};

describe('ChatsService', () => {
  let service: ChatsService;
  let prisma: PrismaService;
  let cache: ChatCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Manually create service instance to bypass forwardRef injection issues
    service = new ChatsService(
      prismaMock as any,
      cacheMock as any,
      gatewayMock as any,
      queueMock as any,
    );

    prisma = prismaMock as any;
    cache = cacheMock as any;

    // Mock private methods that use external services
    jest
      .spyOn(service as any, 'createHireRequestAsync')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'updateHireRequestStatusAsync')
      .mockResolvedValue(undefined);
  });

  describe('getExtensionDuration', () => {
    it('should return 14 days for first extension', () => {
      const result = (service as any).getExtensionDuration(0);
      expect(result).toBe(14);
    });

    it('should return 7 days for second extension', () => {
      const result = (service as any).getExtensionDuration(1);
      expect(result).toBe(7);
    });

    it('should return 3 days for third extension', () => {
      const result = (service as any).getExtensionDuration(2);
      expect(result).toBe(3);
    });

    it('should return 0 days for fourth+ extension', () => {
      const result = (service as any).getExtensionDuration(3);
      expect(result).toBe(0);
      expect((service as any).getExtensionDuration(10)).toBe(0);
    });
  });

  describe('logChatEvent', () => {
    it('should log chat event successfully', async () => {
      prismaMock.chatEvent.create.mockResolvedValue({ id: 'event1' });

      await service.logChatEvent(
        ChatEventType.CHAT_INITIATED,
        'chat1',
        undefined,
        'Chat initiated',
      );

      expect(prismaMock.chatEvent.create).toHaveBeenCalledWith({
        data: {
          chatId: 'chat1',
          requestId: undefined,
          eventType: ChatEventType.CHAT_INITIATED,
          description: 'Chat initiated',
          extensionDays: undefined,
          metadata: undefined,
        },
      });
    });

    it('should log chat event with metadata', async () => {
      prismaMock.chatEvent.create.mockResolvedValue({ id: 'event1' });
      const metadata = { userId: 'user1', action: 'created' };

      await service.logChatEvent(
        ChatEventType.CHAT_INITIATED,
        'chat1',
        'req1',
        'Chat initiated',
        undefined,
        metadata,
      );

      expect(prismaMock.chatEvent.create).toHaveBeenCalledWith({
        data: {
          chatId: 'chat1',
          requestId: 'req1',
          eventType: ChatEventType.CHAT_INITIATED,
          description: 'Chat initiated',
          extensionDays: undefined,
          metadata,
        },
      });
    });

    it('should use transaction client when provided', async () => {
      const txMock = { chatEvent: { create: jest.fn().mockResolvedValue({}) } };
      prismaMock.chatEvent.create.mockResolvedValue({ id: 'event1' });

      await service.logChatEvent(
        ChatEventType.CHAT_ACCEPTED,
        'chat1',
        undefined,
        'Accepted',
        undefined,
        undefined,
        txMock,
      );

      expect(txMock.chatEvent.create).toHaveBeenCalled();
      expect(prismaMock.chatEvent.create).not.toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      prismaMock.chatEvent.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.logChatEvent(ChatEventType.CHAT_INITIATED, 'chat1'),
      ).resolves.not.toThrow();
    });
  });

  describe('generateHireRequestCode', () => {
    it('should generate unique code with HIRE prefix', () => {
      const code1 = (service as any).generateHireRequestCode();
      const code2 = (service as any).generateHireRequestCode();

      expect(code1).toMatch(/^HIRE-/);
      expect(code2).toMatch(/^HIRE-/);
      expect(code1).not.toBe(code2);
    });
  });

  describe('createChat', () => {
    const mockCurrentUser = {
      id: 'user1',
      userType: UserType.COMPANY,
      player: null,
      affiliates: [],
    };

    const mockRecipientPlayer = {
      id: 'user2',
      userType: UserType.PLAYER,
      status: UserStatus.ACTIVE,
      player: {
        club: {
          id: 'club1',
          user: { name: 'Club Name' },
          avatar: 'club-avatar.jpg',
        },
      },
      affiliates: [],
    };

    beforeEach(() => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockRecipientPlayer);
      prismaMock.chat.findFirst.mockResolvedValue(null);
      cacheMock.checkRateLimit.mockResolvedValue(true);
      cacheMock.cacheChat.mockResolvedValue(undefined);
      cacheMock.incrementUnreadCount.mockResolvedValue(1);
      jest
        .spyOn(service as any, 'logChatEvent')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'buildRecipientChatView')
        .mockResolvedValue({
          id: 'chat1',
          status: 'PENDING',
          initiatedBy: 'THEM',
          recipient: { id: 'user2', name: 'Player' },
        });
    });

    it('should create chat successfully for company initiating', async () => {
      const chatData = {
        id: 'chat1',
        status: ChatStatus.PENDING,
        createdAt: new Date(),
        company: {
          id: 'user1',
          name: 'Company Name',
          userType: UserType.COMPANY,
          company: { id: 'comp1', avatar: null, address: null },
        },
        player: {
          id: 'user2',
          name: 'Player Name',
          userType: UserType.PLAYER,
          player: { id: 'player1', avatar: null, address: null },
        },
        messages: [
          {
            id: 'msg1',
            senderId: 'user1',
            content: 'Hello',
            attachments: null,
            createdAt: new Date(),
          },
        ],
      };

      prismaMock.chat.create.mockResolvedValue(chatData);

      const result = await service.createChat(
        'user1',
        UserType.COMPANY,
        {
          recipientId: 'user2',
          content: 'Hello',
        } as any,
      );

      expect(result.message).toBe('Chat created successfully');
      expect(result.data.chat).toBeDefined();
      expect(prismaMock.chat.create).toHaveBeenCalled();
    });

    it('should throw error when creating chat with yourself', async () => {
      await expect(
        service.createChat(
          'user1',
          UserType.COMPANY,
          {
            recipientId: 'user1',
            content: 'Hello',
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when neither content nor attachments provided', async () => {
      await expect(
        service.createChat(
          'user1',
          UserType.COMPANY,
          {
            recipientId: 'user2',
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when recipient not found', async () => {
      // Reset mocks for this test
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(null); // Recipient not found

      await expect(
        service.createChat(
          'user1',
          UserType.COMPANY,
          {
            recipientId: 'user2',
            content: 'Hello',
          } as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when recipient is inactive', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce({
          ...mockRecipientPlayer,
          status: UserStatus.PENDING, // Inactive
        });

      await expect(
        service.createChat(
          'user1',
          UserType.COMPANY,
          {
            recipientId: 'user2',
            content: 'Hello',
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when company tries to message company', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce({
          ...mockRecipientPlayer,
          userType: UserType.COMPANY, // Invalid type
        });

      await expect(
        service.createChat(
          'user1',
          UserType.COMPANY,
          {
            recipientId: 'user2',
            content: 'Hello',
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when player tries to message player', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          ...mockCurrentUser,
          userType: UserType.PLAYER,
          player: { club: null },
        })
        .mockResolvedValueOnce(mockRecipientPlayer); // Player trying to message player

      await expect(
        service.createChat(
          'user1',
          UserType.PLAYER,
          {
            recipientId: 'user2',
            content: 'Hello',
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when active chat already exists', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockRecipientPlayer);
      prismaMock.chat.findFirst.mockReset();
      prismaMock.chat.findFirst.mockResolvedValue({
        id: 'existing-chat',
        status: ChatStatus.PENDING,
      });

      await expect(
        service.createChat(
          'user1',
          UserType.COMPANY,
          {
            recipientId: 'user2',
            content: 'Hello',
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when within 24-hour cooldown after decline', async () => {
      const declinedChat = {
        id: 'declined-chat',
        status: ChatStatus.DECLINED,
        declinedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        initiatorId: 'user1',
      };

      prismaMock.chat.findFirst
        .mockResolvedValueOnce(null) // No active chat
        .mockResolvedValueOnce(declinedChat); // Declined chat found

      await expect(
        service.createChat(
          'user1',
          UserType.COMPANY,
          {
            recipientId: 'user2',
            content: 'Hello',
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow chat creation after 24-hour cooldown', async () => {
      const declinedChat = {
        id: 'declined-chat',
        status: ChatStatus.DECLINED,
        declinedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        initiatorId: 'user1',
      };

      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockRecipientPlayer);
      prismaMock.chat.findFirst.mockReset();
      prismaMock.chat.findFirst
        .mockResolvedValueOnce(null) // No active chat
        .mockResolvedValueOnce(declinedChat); // Declined chat (outside cooldown)

      const chatData = {
        id: 'chat1',
        status: ChatStatus.PENDING,
        createdAt: new Date(),
        company: {
          id: 'user1',
          name: 'Company Name',
          userType: UserType.COMPANY,
          company: { id: 'comp1', avatar: null, address: null },
        },
        player: {
          id: 'user2',
          name: 'Player Name',
          userType: UserType.PLAYER,
          player: { id: 'player1', avatar: null, address: null },
        },
        messages: [
          {
            id: 'msg1',
            senderId: 'user1',
            content: 'Hello',
            attachments: null,
            createdAt: new Date(),
          },
        ],
      };

      prismaMock.chat.create.mockResolvedValue(chatData);

      await service.createChat(
        'user1',
        UserType.COMPANY,
        {
          recipientId: 'user2',
          content: 'Hello',
        } as any,
      );

      expect(prismaMock.chat.create).toHaveBeenCalled();
    });

    it('should create chat with attachments only', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockRecipientPlayer);
      prismaMock.chat.findFirst.mockResolvedValue(null);

      const chatData = {
        id: 'chat1',
        status: ChatStatus.PENDING,
        createdAt: new Date(),
        company: {
          id: 'user1',
          name: 'Company Name',
          userType: UserType.COMPANY,
          company: { id: 'comp1', avatar: null, address: null },
        },
        player: {
          id: 'user2',
          name: 'Player Name',
          userType: UserType.PLAYER,
          player: { id: 'player1', avatar: null, address: null },
        },
        messages: [
          {
            id: 'msg1',
            senderId: 'user1',
            content: null,
            attachments: [{ name: 'file.pdf', url: 'url', category: 'doc', mimeType: 'application/pdf' }],
            createdAt: new Date(),
          },
        ],
      };

      prismaMock.chat.create.mockResolvedValue(chatData);

      const result = await service.createChat(
        'user1',
        UserType.COMPANY,
        {
          recipientId: 'user2',
          attachments: [{ name: 'file.pdf', url: 'url', category: 'doc', mimeType: 'application/pdf' }],
        } as any,
      );

      expect(result.message).toBe('Chat created successfully');
      expect(prismaMock.chat.create).toHaveBeenCalled();
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.createChat(
          'user1',
          UserType.COMPANY,
          {
            recipientId: 'user2',
            content: 'Hello',
          } as any,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('resendChatRequest', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.DECLINED,
      closedBy: 'user2',
      declinedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      participantIds: ['user1', 'user2'],
      companyId: 'user1',
      playerId: 'user2',
      initiatorId: 'user1',
      company: { id: 'user1', name: 'Company' },
      player: { id: 'user2', name: 'Player' },
    };

    beforeEach(() => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn({
          chat: {
            findUnique: jest.fn().mockResolvedValue(mockChat),
            update: jest.fn().mockResolvedValue({
              ...mockChat,
              status: ChatStatus.PENDING,
              closedBy: null,
              declinedAt: null,
            }),
          },
          user: {
            findUnique: jest.fn(),
          },
        });
      });

      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: 'user1',
          userType: UserType.COMPANY,
          player: null,
          affiliates: [],
        })
        .mockResolvedValueOnce({
          id: 'user2',
          userType: UserType.PLAYER,
          status: UserStatus.ACTIVE,
          player: { club: null },
          affiliates: [],
        });
    });

    it('should resend declined chat request', async () => {
      // Reset transaction mock
      prismaMock.$transaction.mockReset();
      prismaMock.user.findUnique.mockReset();

      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn({
          chat: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'chat1',
              status: ChatStatus.DECLINED,
              closedBy: 'user2',
              declinedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
              participantIds: ['user1', 'user2'],
              companyId: 'user1',
              playerId: 'user2',
              initiatorId: 'user1',
              company: { id: 'user1', name: 'Company' },
              player: { id: 'user2', name: 'Player' },
            }),
            update: jest.fn().mockResolvedValue({
              id: 'chat1',
              status: ChatStatus.PENDING,
              companyId: 'user1',
              playerId: 'user2',
              company: {
                id: 'user1',
                name: 'Company',
                userType: UserType.COMPANY,
                company: { avatar: null, address: null },
              },
              player: {
                id: 'user2',
                name: 'Player',
                userType: UserType.PLAYER,
                player: { avatar: null, address: null },
              },
            }),
          },
        });
      });

      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: 'user1',
          userType: UserType.COMPANY,
          player: null,
          affiliates: [],
        })
        .mockResolvedValueOnce({
          id: 'user2',
          userType: UserType.PLAYER,
          status: UserStatus.ACTIVE,
          player: { club: null },
          affiliates: [],
        });

      cacheMock.updateChatStatus.mockResolvedValue(undefined);
      cacheMock.incrementUnreadCount.mockResolvedValue(1);
      jest
        .spyOn(service as any, 'logChatEvent')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'buildChatResponse')
        .mockReturnValue({
          id: 'chat1',
          status: 'PENDING',
          initiatedBy: 'ME',
          recipient: { id: 'user2', name: 'Player' },
        });

      const result = await service.resendChatRequest('user1', {
        chatId: 'chat1',
      } as any);

      expect(result.message).toBe('Chat re-requested successfully');
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should throw error when chat not found', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn({
          chat: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(
        service.resendChatRequest('user1', { chatId: 'chat1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when user is not participant', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn({
          chat: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockChat,
              participantIds: ['user3', 'user4'],
            }),
          },
        });
      });

      await expect(
        service.resendChatRequest('user1', { chatId: 'chat1' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when chat is not declined', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn({
          chat: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockChat,
              status: ChatStatus.ACCEPTED,
            }),
          },
        });
      });

      await expect(
        service.resendChatRequest('user1', { chatId: 'chat1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when within cooldown period', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn({
          chat: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockChat,
              declinedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            }),
          },
        });
      });

      await expect(
        service.resendChatRequest('user1', { chatId: 'chat1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when user tries to resend own declined chat', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn({
          chat: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockChat,
              closedBy: 'user1', // User declined their own chat
            }),
          },
        });
      });

      await expect(
        service.resendChatRequest('user1', { chatId: 'chat1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('DB error'));

      await expect(
        service.resendChatRequest('user1', { chatId: 'chat1' } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('acceptChat', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.PENDING,
      initiatorId: 'user1',
      participantIds: ['user1', 'user2'],
      companyId: 'user1',
      playerId: 'user2',
      company: { name: 'Company' },
      player: { name: 'Player' },
    };

    beforeEach(() => {
      prismaMock.chat.findUnique.mockResolvedValue(mockChat);
      prismaMock.chat.update.mockResolvedValue({
        id: 'chat1',
        status: ChatStatus.ACCEPTED,
        acceptedAt: new Date(),
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      });
      queueMock.add.mockResolvedValue({ id: 'job1' });
    });

    it('should accept chat successfully', async () => {
      const result = await service.acceptChat('chat1', 'user2');

      expect(result.message).toBe('Chat accepted successfully');
      expect(result.data.status).toBe('ACCEPTED');
      expect(prismaMock.chat.update).toHaveBeenCalled();
      expect(cacheMock.updateChatStatus).toHaveBeenCalled();
      expect(queueMock.add).toHaveBeenCalled();
    });

    it('should throw error when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(service.acceptChat('chat1', 'user2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when user is not participant', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        participantIds: ['user3', 'user4'],
      });

      await expect(service.acceptChat('chat1', 'user2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw error when initiator tries to accept', async () => {
      await expect(service.acceptChat('chat1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw error when chat is not pending', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.ACCEPTED,
      });

      await expect(service.acceptChat('chat1', 'user2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.acceptChat('chat1', 'user2')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('declineChat', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.PENDING,
      initiatorId: 'user1',
      participantIds: ['user1', 'user2'],
      companyId: 'user1',
      playerId: 'user2',
      company: { name: 'Company' },
      player: { name: 'Player' },
    };

    beforeEach(() => {
      prismaMock.chat.findUnique.mockResolvedValue(mockChat);
      prismaMock.chat.update.mockResolvedValue({
        id: 'chat1',
        status: ChatStatus.DECLINED,
      });
      queueMock.getJob.mockResolvedValue(null);
    });

    it('should decline chat successfully', async () => {
      const result = await service.declineChat('chat1', 'user2');

      expect(result.message).toBe('Chat declined successfully');
      expect(result.data.status).toBe('DECLINED');
      expect(prismaMock.chat.update).toHaveBeenCalled();
      expect(cacheMock.updateChatStatus).toHaveBeenCalled();
    });

    it('should throw error when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(service.declineChat('chat1', 'user2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when user is not participant', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        participantIds: ['user3', 'user4'],
      });

      await expect(service.declineChat('chat1', 'user2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw error when initiator tries to decline', async () => {
      await expect(service.declineChat('chat1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw error when chat is not pending', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.ACCEPTED,
      });

      await expect(service.declineChat('chat1', 'user2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should remove expiry job if exists', async () => {
      const jobMock = { remove: jest.fn().mockResolvedValue(undefined) };
      queueMock.getJob.mockResolvedValue(jobMock);

      await service.declineChat('chat1', 'user2');

      expect(queueMock.getJob).toHaveBeenCalledWith('chat-expiry-chat1');
      expect(jobMock.remove).toHaveBeenCalled();
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.declineChat('chat1', 'user2')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('extendChat', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.ACCEPTED,
      initiatorId: 'user1',
      participantIds: ['user1', 'user2'],
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      extensionCount: 0,
      companyId: 'user1',
      playerId: 'user2',
      company: { name: 'Company' },
      player: { name: 'Player' },
    };

    beforeEach(() => {
      prismaMock.chat.findUnique.mockResolvedValue(mockChat);
      prismaMock.chat.update.mockResolvedValue({
        id: 'chat1',
        expiresAt: new Date(),
        extensionCount: 1,
      });
      queueMock.getJob.mockResolvedValue(null);
      queueMock.add.mockResolvedValue({ id: 'job1' });
    });

    it('should extend chat by 14 days for first extension', async () => {
      const result = await service.extendChat('chat1', 'user1');

      expect(result.message).toBe('Chat extended by 14 days');
      expect(prismaMock.chat.update).toHaveBeenCalled();
      expect(gatewayMock.notifyChatExtended).toHaveBeenCalledWith('chat1');
      expect(queueMock.add).toHaveBeenCalled();
    });

    it('should extend chat by 7 days for second extension', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        extensionCount: 1,
      });

      const result = await service.extendChat('chat1', 'user1');

      expect(result.message).toBe('Chat extended by 7 days');
    });

    it('should extend chat by 3 days for third extension', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        extensionCount: 2,
      });

      const result = await service.extendChat('chat1', 'user1');

      expect(result.message).toBe('Chat extended by 3 days');
    });

    it('should throw error when max extensions reached', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        extensionCount: 3,
      });

      await expect(service.extendChat('chat1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(service.extendChat('chat1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when user is not participant', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        participantIds: ['user3', 'user4'],
      });

      await expect(service.extendChat('chat1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw error when non-initiator tries to extend', async () => {
      await expect(service.extendChat('chat1', 'user2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw error when chat is not accepted', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.PENDING,
      });

      await expect(service.extendChat('chat1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when chat has no expiry date', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        expiresAt: null,
      });

      await expect(service.extendChat('chat1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.extendChat('chat1', 'user1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUnattendedCount', () => {
    it('should return count of unattended chats', async () => {
      prismaMock.chat.count.mockResolvedValue(5);

      const result = await service.getUnattendedCount('user1');

      expect(result).not.toBe(0);
      expect(result).not.toBe(null);
      if (result !== 0) {
        expect(result.message).toBe(
          'Successfully fetched the unattended count',
        );
        expect(result.data).toBe(5);
      }
      expect(prismaMock.chat.count).toHaveBeenCalledWith({
        where: {
          OR: [{ companyId: 'user1' }, { playerId: 'user1' }],
          status: ChatStatus.PENDING,
          initiatorId: { not: 'user1' },
        },
      });
    });

    it('should return 0 on error', async () => {
      prismaMock.chat.count.mockRejectedValue(new Error('DB error'));

      const result = await service.getUnattendedCount('user1');

      expect(result).toBe(0);
    });
  });

  describe('getChats', () => {
    const mockChats = [
      {
        id: 'chat1',
        status: ChatStatus.ACCEPTED,
        companyId: 'user1',
        closedBy: null,
        lastMessageAt: new Date(),
        expiresAt: null,
        createdAt: new Date(),
        company: {
          id: 'user1',
          name: 'Company',
          userType: UserType.COMPANY,
          company: { avatar: null },
        },
        player: {
          id: 'user2',
          name: 'Player',
          userType: UserType.PLAYER,
          player: { avatar: null },
        },
        messages: [
          {
            id: 'msg1',
            content: 'Hello',
            attachments: null,
            senderId: 'user1',
            createdAt: new Date(),
          },
        ],
      },
    ];

    beforeEach(() => {
      prismaMock.chat.findMany.mockResolvedValue(mockChats);
      prismaMock.chat.count.mockResolvedValue(1);
      cacheMock.getAllUnreadCounts.mockResolvedValue({});
      cacheMock.getDeletedChats.mockResolvedValue([]);
    });

    it('should return chats for user', async () => {
      const result = await service.getChats('user1');

      expect(result.message).toBe('Chats retrieved successfully');
      expect(result.data.data).toBeDefined();
      expect(prismaMock.chat.findMany).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      await service.getChats('user1', undefined, 'Player');

      expect(prismaMock.chat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter by read/unread status', async () => {
      cacheMock.getAllUnreadCounts.mockResolvedValue({
        chat1: 0,
      });

      const result = await service.getChats('user1', 'READ');

      expect(result.data.data.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle pagination', async () => {
      await service.getChats('user1', undefined, undefined, 2, 10);

      expect(prismaMock.chat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should filter out deleted chats', async () => {
      cacheMock.getDeletedChats.mockResolvedValue(['chat1']);

      const result = await service.getChats('user1');

      expect(result.data.data.every((chat: any) => chat.id !== 'chat1')).toBe(
        true,
      );
    });

    it('should format attachment-only messages', async () => {
      prismaMock.chat.findMany.mockResolvedValue([
        {
          ...mockChats[0],
          messages: [
            {
              id: 'msg1',
              content: null,
              attachments: [{ name: 'file.pdf' }],
              senderId: 'user1',
              createdAt: new Date(),
            },
          ],
        },
      ]);

      const result = await service.getChats('user1');

      expect(result.data.data[0].message).toContain('attachment');
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.getChats('user1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getChatById', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.ACCEPTED,
      companyId: 'user1',
      playerId: 'user2',
      closedBy: null,
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      participantIds: ['user1', 'user2'],
      initiatorId: 'user1',
      company: {
        id: 'user1',
        name: 'Company',
        userType: UserType.COMPANY,
        company: {
          id: 'comp1',
          avatar: null,
          address: null,
        },
        affiliates: [],
      },
      player: {
        id: 'user2',
        name: 'Player',
        userType: UserType.PLAYER,
        player: {
          id: 'player1',
          avatar: null,
          address: null,
          club: {
            id: 'club1',
            user: { name: 'Club' },
            avatar: null,
          },
        },
      },
    };

    beforeEach(() => {
      prismaMock.chat.findUnique.mockResolvedValue(mockChat);
    });

    it('should return pending chat', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.PENDING,
        expiresAt: null,
      });

      const result = await service.getChatById('chat1', 'user1');

      expect(result.message).toBe('Chat retrieved successfully');
      expect(result.data.status).toBe(ChatStatus.PENDING);
      expect(result.data.initiatedBy).toBe('ME');
    });

    it('should return accepted chat with expiresAt', async () => {
      const result = await service.getChatById('chat1', 'user1');

      expect(result.data.status).toBe(ChatStatus.ACCEPTED);
      expect(result.data.expiresAt).toBeDefined();
    });

    it('should return declined chat with closedBy', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.DECLINED,
        closedBy: 'user2',
        expiresAt: null,
      });

      const result = await service.getChatById('chat1', 'user1');

      expect(result.data.status).toBe(ChatStatus.DECLINED);
      expect(result.data.closedBy).toBe('THEM');
    });

    it('should return ended chat with closedBy', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.ENDED,
        closedBy: 'user1',
        expiresAt: null,
      });

      const result = await service.getChatById('chat1', 'user1');

      expect(result.data.status).toBe(ChatStatus.ENDED);
      expect(result.data.closedBy).toBe('ME');
    });

    it('should return expired chat with EXPIRATION closedBy', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.EXPIRED,
        expiresAt: null,
      });

      const result = await service.getChatById('chat1', 'user1');

      expect(result.data.status).toBe(ChatStatus.EXPIRED);
      expect(result.data.closedBy).toBe('EXPIRATION');
    });

    it('should throw error when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(service.getChatById('chat1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when user is not participant', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        participantIds: ['user3', 'user4'],
      });

      await expect(service.getChatById('chat1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.getChatById('chat1', 'user1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('verifyChatAccess', () => {
    beforeEach(() => {
      cacheMock.isParticipantCached.mockResolvedValue(null);
    });

    it('should verify access from cache', async () => {
      cacheMock.isParticipantCached.mockResolvedValue(true);

      await service.verifyChatAccess('chat1', 'user1');

      expect(cacheMock.isParticipantCached).toHaveBeenCalledWith(
        'chat1',
        'user1',
      );
      expect(prismaMock.chat.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error when user not participant in cache', async () => {
      cacheMock.isParticipantCached.mockResolvedValue(false);

      await expect(
        service.verifyChatAccess('chat1', 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should query database on cache miss', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        id: 'chat1',
        participantIds: ['user1', 'user2'],
        status: ChatStatus.ACCEPTED,
        companyId: 'user1',
        playerId: 'user2',
      });

      await service.verifyChatAccess('chat1', 'user1');

      expect(prismaMock.chat.findUnique).toHaveBeenCalled();
      expect(cacheMock.cacheParticipantVerification).toHaveBeenCalledWith(
        'chat1',
        'user1',
        true,
      );
    });

    it('should throw error when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyChatAccess('chat1', 'user1'),
      ).rejects.toThrow(NotFoundException);
      expect(cacheMock.cacheParticipantVerification).toHaveBeenCalledWith(
        'chat1',
        'user1',
        false,
      );
    });

    it('should throw error when user not participant', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        id: 'chat1',
        participantIds: ['user3', 'user4'],
        status: ChatStatus.ACCEPTED,
        companyId: 'user3',
        playerId: 'user4',
      });

      await expect(
        service.verifyChatAccess('chat1', 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      cacheMock.isParticipantCached.mockRejectedValue(new Error('Cache error'));

      await expect(
        service.verifyChatAccess('chat1', 'user1'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getMessages', () => {
    const mockMessages = [
      {
        id: 'msg1',
        senderId: 'user1',
        content: 'Hello',
        attachments: null,
        deliveredAt: new Date(),
        readAt: null,
        createdAt: new Date(),
      },
    ];

    beforeEach(() => {
      cacheMock.isParticipantCached.mockResolvedValue(true);
      cacheMock.getDeletedAt.mockResolvedValue(null);
      prismaMock.message.findMany.mockResolvedValue(mockMessages);
      prismaMock.message.count.mockResolvedValue(1);
    });

    it('should return messages for chat', async () => {
      const result = await service.getMessages('chat1', 'user1');

      expect(result.message).toBe('Messages retrieved successfully');
      expect(result.data.data).toBeDefined();
      expect(prismaMock.message.findMany).toHaveBeenCalled();
    });

    it('should filter messages after deleted timestamp', async () => {
      cacheMock.getDeletedAt.mockResolvedValue(
        new Date('2025-01-01').toISOString(),
      );

      await service.getMessages('chat1', 'user1');

      expect(prismaMock.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        }),
      );
    });

    it('should format message status correctly', async () => {
      prismaMock.message.findMany.mockResolvedValue([
        {
          id: 'msg1',
          senderId: 'user1',
          content: 'Hello',
          attachments: null,
          deliveredAt: null,
          readAt: null,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getMessages('chat1', 'user1');

      expect(result.data.data[0].status).toBe('SENT');
    });

    it('should handle messages with attachments only', async () => {
      prismaMock.message.findMany.mockResolvedValue([
        {
          id: 'msg1',
          senderId: 'user1',
          content: null,
          attachments: [{ name: 'file.pdf' }],
          deliveredAt: new Date(),
          readAt: null,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getMessages('chat1', 'user1');

      expect(result.data.data[0].attachments).toBeDefined();
      expect(result.data.data[0].content).toBeUndefined();
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      cacheMock.isParticipantCached.mockRejectedValue(new Error('Cache error'));

      await expect(service.getMessages('chat1', 'user1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('validateMessageSend', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.ACCEPTED,
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      participantIds: ['user1', 'user2'],
      companyId: 'user1',
      playerId: 'user2',
      initiatorId: 'user1',
      acceptedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      cacheMock.getCachedChat.mockResolvedValue(mockChat);
      prismaMock.message.count.mockResolvedValue(10);
    });

    it('should validate message send for accepted chat', async () => {
      await expect(
        service.validateMessageSend('chat1', 'user1'),
      ).resolves.not.toThrow();
    });

    it('should throw error when chat not found', async () => {
      cacheMock.getCachedChat.mockResolvedValue(null);
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(
        service.validateMessageSend('chat1', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when user not participant', async () => {
      cacheMock.getCachedChat.mockResolvedValue({
        ...mockChat,
        participantIds: ['user3', 'user4'],
      });

      await expect(
        service.validateMessageSend('chat1', 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when pending chat has message limit', async () => {
      cacheMock.getCachedChat.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.PENDING,
      });
      prismaMock.message.count.mockResolvedValue(1);

      await expect(
        service.validateMessageSend('chat1', 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when chat is declined', async () => {
      cacheMock.getCachedChat.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.DECLINED,
      });

      await expect(
        service.validateMessageSend('chat1', 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when chat is expired', async () => {
      cacheMock.getCachedChat.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.EXPIRED,
      });

      await expect(
        service.validateMessageSend('chat1', 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when chat is ended', async () => {
      cacheMock.getCachedChat.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.ENDED,
      });

      await expect(
        service.validateMessageSend('chat1', 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update status to expired when expiresAt passed', async () => {
      cacheMock.getCachedChat.mockResolvedValue({
        ...mockChat,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
      prismaMock.chat.update.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.EXPIRED,
      });

      await expect(
        service.validateMessageSend('chat1', 'user1'),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.chat.update).toHaveBeenCalledWith({
        where: { id: 'chat1' },
        data: { status: ChatStatus.EXPIRED },
      });
      expect(cacheMock.updateChatStatus).toHaveBeenCalledWith(
        'chat1',
        ChatStatus.EXPIRED,
      );
    });
  });

  describe('validateMessageOwnership', () => {
    const mockMessage = {
      id: 'msg1',
      chatId: 'chat1',
      senderId: 'user1',
    };

    beforeEach(() => {
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
    });

    it('should validate message ownership', async () => {
      await expect(
        service.validateMessageOwnership('msg1', 'chat1', 'user1'),
      ).resolves.not.toThrow();
    });

    it('should throw error when message not found', async () => {
      prismaMock.message.findUnique.mockResolvedValue(null);

      await expect(
        service.validateMessageOwnership('msg1', 'chat1', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when message belongs to different chat', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        ...mockMessage,
        chatId: 'chat2',
      });

      await expect(
        service.validateMessageOwnership('msg1', 'chat1', 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when user is not message sender', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        ...mockMessage,
        senderId: 'user2',
      });

      await expect(
        service.validateMessageOwnership('msg1', 'chat1', 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendMessage', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.ACCEPTED,
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      participantIds: ['user1', 'user2'],
      companyId: 'user1',
      playerId: 'user2',
      initiatorId: 'user1',
      acceptedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      cacheMock.checkRateLimit.mockResolvedValue(true);
      cacheMock.getCachedChat.mockResolvedValue(mockChat);
      prismaMock.message.count.mockResolvedValue(10);
      cacheMock.getDeletedAt.mockResolvedValue(null);
    });

    it('should send message successfully', async () => {
      const result = await service.sendMessage('chat1', 'user1', {
        content: 'Hello',
      });

      expect(result.message).toBe('Message sent successfully');
      expect(result.data.messageId).toBeDefined();
      expect(cacheMock.addMessageToCache).toHaveBeenCalled();
    });

    it('should throw error when neither content nor attachments', async () => {
      await expect(
        service.sendMessage('chat1', 'user1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when content too long', async () => {
      const longContent = 'a'.repeat(1001);

      await expect(
        service.sendMessage('chat1', 'user1', { content: longContent }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when too many attachments', async () => {
      const attachments = Array(11).fill({
        name: 'file.pdf',
        url: 'url',
        category: 'doc',
        mimeType: 'application/pdf',
      });

      await expect(
        service.sendMessage('chat1', 'user1', { attachments }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when rate limit exceeded', async () => {
      cacheMock.checkRateLimit.mockResolvedValue(false);

      await expect(
        service.sendMessage('chat1', 'user1', { content: 'Hello' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should restore chat when recipient had deleted it', async () => {
      cacheMock.getDeletedAt.mockResolvedValue(
        new Date().toISOString(),
      );
      jest.spyOn(service, 'restoreChat').mockResolvedValue(undefined);

      await service.sendMessage('chat1', 'user1', { content: 'Hello' });

      expect(service.restoreChat).toHaveBeenCalledWith('chat1', 'user2');
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      cacheMock.checkRateLimit.mockRejectedValue(new Error('Cache error'));

      await expect(
        service.sendMessage('chat1', 'user1', { content: 'Hello' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateMessage', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.ACCEPTED,
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      participantIds: ['user1', 'user2'],
      companyId: 'user1',
      playerId: 'user2',
      initiatorId: 'user1',
      acceptedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      cacheMock.checkRateLimit.mockResolvedValue(true);
      cacheMock.getCachedChat.mockResolvedValue(mockChat);
      prismaMock.message.count.mockResolvedValue(10);
      prismaMock.message.findUnique.mockResolvedValue({
        id: 'msg1',
        chatId: 'chat1',
        senderId: 'user1',
      });
    });

    it('should update message successfully', async () => {
      const result = await service.updateMessage(
        'chat1',
        'user1',
        'msg1',
        { content: 'Updated' },
      );

      expect(result.message).toBe('Message updated successfully');
      expect(cacheMock.updateMessageInCache).toHaveBeenCalled();
    });

    it('should throw error when no updates provided', async () => {
      await expect(
        service.updateMessage('chat1', 'user1', 'msg1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when content too long', async () => {
      const longContent = 'a'.repeat(1001);

      await expect(
        service.updateMessage('chat1', 'user1', 'msg1', {
          content: longContent,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when too many attachments', async () => {
      const attachments = Array(11).fill({
        name: 'file.pdf',
        url: 'url',
        category: 'doc',
        mimeType: 'application/pdf',
      });

      await expect(
        service.updateMessage('chat1', 'user1', 'msg1', { attachments }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      cacheMock.getCachedChat.mockRejectedValue(new Error('Cache error'));

      await expect(
        service.updateMessage('chat1', 'user1', 'msg1', { content: 'Updated' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('endChat', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.ACCEPTED,
      participantIds: ['user1', 'user2'],
      companyId: 'user1',
      playerId: 'user2',
      company: { name: 'Company' },
      player: { name: 'Player' },
    };

    beforeEach(() => {
      prismaMock.chat.findUnique.mockResolvedValue(mockChat);
      prismaMock.chat.update.mockResolvedValue({
        id: 'chat1',
        status: ChatStatus.ENDED,
      });
      queueMock.getJob.mockResolvedValue(null);
    });

    it('should end chat successfully', async () => {
      const result = await service.endChat('chat1', 'user1');

      expect(result.message).toBe('Chat ended successfully');
      expect(result.data.status).toBe('ENDED');
      expect(prismaMock.chat.update).toHaveBeenCalled();
      expect(cacheMock.updateChatStatus).toHaveBeenCalledWith(
        'chat1',
        ChatStatus.ENDED,
      );
    });

    it('should throw error when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(service.endChat('chat1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when user is not participant', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        participantIds: ['user3', 'user4'],
      });

      await expect(service.endChat('chat1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw error when chat is not accepted', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        status: ChatStatus.PENDING,
      });

      await expect(service.endChat('chat1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should remove expiry job if exists', async () => {
      const jobMock = { remove: jest.fn().mockResolvedValue(undefined) };
      queueMock.getJob.mockResolvedValue(jobMock);

      await service.endChat('chat1', 'user1');

      expect(queueMock.getJob).toHaveBeenCalledWith('chat-expiry-chat1');
      expect(jobMock.remove).toHaveBeenCalled();
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.endChat('chat1', 'user1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteChat', () => {
    const mockChat = {
      id: 'chat1',
      participantIds: ['user1', 'user2'],
      deletedBy: null,
    };

    beforeEach(() => {
      prismaMock.chat.findUnique.mockResolvedValue(mockChat);
      prismaMock.chat.update.mockResolvedValue({
        ...mockChat,
        deletedBy: { user1: new Date().toISOString() },
      });
    });

    it('should delete chat successfully', async () => {
      const result = await service.deleteChat('chat1', 'user1');

      expect(result.message).toBe('Chat deleted successfully');
      expect(cacheMock.markAsDeleted).toHaveBeenCalled();
      expect(cacheMock.resetUnreadCount).toHaveBeenCalled();
    });

    it('should throw error when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(service.deleteChat('chat1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when user is not participant', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        participantIds: ['user3', 'user4'],
      });

      await expect(service.deleteChat('chat1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteChat('chat1', 'user1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('restoreChat', () => {
    const mockChat = {
      id: 'chat1',
      status: ChatStatus.ACCEPTED,
      expiresAt: new Date(),
      participantIds: ['user1', 'user2'],
      companyId: 'user1',
      playerId: 'user2',
      initiatorId: 'user1',
      acceptedAt: new Date(),
      deletedBy: { user1: new Date().toISOString() },
    };

    beforeEach(() => {
      prismaMock.chat.findUnique.mockResolvedValue(mockChat);
      prismaMock.chat.update.mockResolvedValue({
        ...mockChat,
        deletedBy: null,
      });
    });

    it('should restore chat successfully', async () => {
      await service.restoreChat('chat1', 'user1');

      expect(cacheMock.removeFromDeleted).toHaveBeenCalled();
      expect(cacheMock.cacheChat).toHaveBeenCalled();
    });

    it('should do nothing when chat not deleted by user', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({
        ...mockChat,
        deletedBy: { user2: new Date().toISOString() },
      });

      await service.restoreChat('chat1', 'user1');

      expect(cacheMock.removeFromDeleted).not.toHaveBeenCalled();
    });

    it('should throw error when chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null);

      await expect(service.restoreChat('chat1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.restoreChat('chat1', 'user1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getSuggestedProfiles', () => {
    beforeEach(() => {
      prismaMock.chat.findMany.mockResolvedValue([]);
    });

    it('should return suggested profiles for company', async () => {
      prismaMock.player.findMany.mockResolvedValue([
        {
          id: 'player1',
          avatar: null,
          address: null,
          clubId: 'club1',
          user: {
            id: 'user1',
            name: 'Player',
            userType: UserType.PLAYER,
          },
          club: {
            id: 'club1',
            user: { name: 'Club' },
            avatar: null,
          },
        },
      ]);
      prismaMock.player.count.mockResolvedValue(1);

      const result = await service.getSuggestedProfiles(
        'company-user',
        UserType.COMPANY,
        'company-profile',
      );

      expect(result.message).toBe(
        'Suggested profiles retrieved successfully',
      );
      expect(result.data.data).toBeDefined();
    });

    it('should return suggested profiles for player', async () => {
      prismaMock.company.findMany.mockResolvedValue([
        {
          id: 'company1',
          avatar: null,
          address: null,
          user: {
            id: 'user1',
            name: 'Company',
            userType: UserType.COMPANY,
          },
        },
      ]);
      prismaMock.company.count.mockResolvedValue(1);
      prismaMock.player.findUnique.mockResolvedValue({
        id: 'player-profile',
        clubId: 'club1',
        club: {
          id: 'club1',
          user: { name: 'Club' },
          avatar: null,
        },
      });

      const result = await service.getSuggestedProfiles(
        'player-user',
        UserType.PLAYER,
        'player-profile',
      );

      expect(result.message).toBe(
        'Suggested profiles retrieved successfully',
      );
      expect(result.data.data).toBeDefined();
    });

    it('should exclude existing chat participants', async () => {
      prismaMock.chat.findMany.mockResolvedValue([
        { companyId: 'company-user', playerId: 'existing-player' },
      ]);
      prismaMock.player.findMany.mockResolvedValue([]);
      prismaMock.player.count.mockResolvedValue(0);

      await service.getSuggestedProfiles(
        'company-user',
        UserType.COMPANY,
        'company-profile',
      );

      expect(prismaMock.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: expect.objectContaining({
              notIn: expect.arrayContaining(['company-user', 'existing-player']),
            }),
          }),
        }),
      );
    });

    it('should filter by search term', async () => {
      prismaMock.player.findMany.mockResolvedValue([]);
      prismaMock.player.count.mockResolvedValue(0);

      await service.getSuggestedProfiles(
        'company-user',
        UserType.COMPANY,
        'company-profile',
        'Player',
      );

      expect(prismaMock.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              name: expect.objectContaining({
                contains: 'Player',
                mode: 'insensitive',
              }),
            }),
          }),
        }),
      );
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.chat.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getSuggestedProfiles('user1', UserType.COMPANY, 'profile1'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getSuggestedProfileById', () => {
    it('should return suggested profile by ID', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        name: 'Player',
        userType: UserType.PLAYER,
        status: UserStatus.ACTIVE,
        player: {
          id: 'player1',
          avatar: null,
          address: null,
          club: {
            id: 'club1',
            user: { name: 'Club' },
            avatar: null,
          },
        },
        company: null,
      });

      const result = await service.getSuggestedProfileById(
        'current-user',
        'user1',
      );

      expect(result.message).toBe(
        'Suggested profile retrieved successfully',
      );
      expect(result.data).toBeDefined();
    });

    it('should throw error when trying to get own profile', async () => {
      await expect(
        service.getSuggestedProfileById('user1', 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when profile not found or inactive', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getSuggestedProfileById('current-user', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should wrap unexpected errors as InternalServerErrorException', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getSuggestedProfileById('current-user', 'user1'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getBulkSuggestedProfilesById', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        player: {
          club: {
            id: 'club1',
            user: { name: 'Club' },
            avatar: null,
          },
        },
      });
    });

    it('should return bulk suggested profiles', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: 'current-user',
          player: {
            club: {
              id: 'club1',
              user: { name: 'Club' },
              avatar: null,
            },
          },
        })
        .mockResolvedValueOnce({
          id: 'user1',
          name: 'Player',
          userType: UserType.PLAYER,
          status: UserStatus.ACTIVE,
          player: {
            id: 'player1',
            avatar: null,
            address: null,
            club: {
              id: 'club1',
              user: { name: 'Club' },
              avatar: null,
            },
          },
          company: null,
        });

      const result = await service.getBulkSuggestedProfilesById(
        'current-user',
        UserType.PLAYER,
        ['user1'],
      );

      expect(result.data.profiles).toBeDefined();
      expect(result.data.failed).toBeDefined();
    });

    it('should filter out current user ID', async () => {
      const result = await service.getBulkSuggestedProfilesById(
        'current-user',
        UserType.PLAYER,
        ['current-user', 'user1'],
      );

      expect(result.data.profiles).toBeDefined();
      expect(result.data.failed.some((f: any) => f.id === 'current-user')).toBe(
        true,
      );
    });

    it('should handle errors gracefully', async () => {
      prismaMock.user.findUnique.mockReset();
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getBulkSuggestedProfilesById('current-user', UserType.PLAYER, [
          'user1',
        ]),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});

