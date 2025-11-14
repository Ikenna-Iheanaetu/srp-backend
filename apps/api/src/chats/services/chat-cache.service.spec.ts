import { Test, TestingModule } from '@nestjs/testing';
import { ChatCacheService } from './chat-cache.service';
import { RedisService } from '../../redis/redis.service';
import { ChatStatus } from '@prisma/client';

const redisMock = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  incr: jest.fn(),
  mget: jest.fn(),
  zadd: jest.fn(),
  zrevrange: jest.fn(),
  zrange: jest.fn(),
  zrem: jest.fn(),
  zremrangebyrank: jest.fn(),
  keys: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  srem: jest.fn(),
  pipeline: jest.fn(),
};

describe('ChatCacheService', () => {
  let service: ChatCacheService;
  let redisService: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatCacheService,
        {
          provide: RedisService,
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<ChatCacheService>(ChatCacheService);
    redisService = module.get<RedisService>(RedisService);
  });

  describe('cacheChat', () => {
    it('should cache chat data with TTL', async () => {
      const chat = {
        id: 'chat1',
        status: ChatStatus.PENDING,
        expiresAt: null,
        participantIds: ['user1', 'user2'],
        companyId: 'user1',
        playerId: 'user2',
        initiatorId: 'user1',
        acceptedAt: null,
      };

      await service.cacheChat(chat);

      expect(redisMock.set).toHaveBeenCalledWith(
        'chat:chat1',
        JSON.stringify(chat),
        86400, // 24 hours TTL
      );
    });
  });

  describe('getCachedChat', () => {
    it('should return cached chat when found', async () => {
      const chat = {
        id: 'chat1',
        status: ChatStatus.PENDING,
        expiresAt: null,
        participantIds: ['user1', 'user2'],
        companyId: 'user1',
        playerId: 'user2',
        initiatorId: 'user1',
        acceptedAt: null,
      };

      redisMock.get.mockResolvedValue(JSON.stringify(chat));

      const result = await service.getCachedChat('chat1');

      expect(result).toEqual(chat);
      expect(redisMock.get).toHaveBeenCalledWith('chat:chat1');
    });

    it('should return null when chat not found', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.getCachedChat('chat1');

      expect(result).toBeNull();
    });
  });

  describe('updateChatStatus', () => {
    it('should update status in cached chat', async () => {
      const cachedChat = {
        id: 'chat1',
        status: ChatStatus.PENDING,
        expiresAt: null,
        participantIds: ['user1', 'user2'],
        companyId: 'user1',
        playerId: 'user2',
        initiatorId: 'user1',
        acceptedAt: null,
      };

      redisMock.get.mockResolvedValue(JSON.stringify(cachedChat));

      const expiresAt = new Date('2025-12-31');
      const acceptedAt = new Date('2025-01-01');

      await service.updateChatStatus(
        'chat1',
        ChatStatus.ACCEPTED,
        expiresAt,
        acceptedAt,
      );

      expect(redisMock.get).toHaveBeenCalledWith('chat:chat1');
      expect(redisMock.set).toHaveBeenCalledWith(
        'chat:chat1',
        JSON.stringify({
          ...cachedChat,
          status: ChatStatus.ACCEPTED,
          expiresAt: expiresAt.toISOString(),
          acceptedAt: acceptedAt.toISOString(),
        }),
        86400,
      );
    });

    it('should update status with null expiresAt and acceptedAt', async () => {
      const cachedChat = {
        id: 'chat1',
        status: ChatStatus.PENDING,
        expiresAt: '2025-12-31T00:00:00.000Z',
        participantIds: ['user1', 'user2'],
        companyId: 'user1',
        playerId: 'user2',
        initiatorId: 'user1',
        acceptedAt: '2025-01-01T00:00:00.000Z',
      };

      redisMock.get.mockResolvedValue(JSON.stringify(cachedChat));

      await service.updateChatStatus('chat1', ChatStatus.DECLINED, null, null);

      expect(redisMock.set).toHaveBeenCalledWith(
        'chat:chat1',
        JSON.stringify({
          ...cachedChat,
          status: ChatStatus.DECLINED,
          expiresAt: null,
          acceptedAt: null,
        }),
        86400,
      );
    });

    it('should do nothing if chat not in cache', async () => {
      redisMock.get.mockResolvedValue(null);

      await service.updateChatStatus('chat1', ChatStatus.ACCEPTED);

      expect(redisMock.get).toHaveBeenCalledWith('chat:chat1');
      expect(redisMock.set).not.toHaveBeenCalled();
    });
  });

  describe('deleteChat', () => {
    it('should delete chat from cache', async () => {
      await service.deleteChat('chat1');

      expect(redisMock.del).toHaveBeenCalledWith('chat:chat1');
    });
  });

  describe('cacheMessages', () => {
    it('should cache messages in sorted set', async () => {
      const messages = [
        {
          id: 'msg1',
          chatId: 'chat1',
          senderId: 'user1',
          content: 'Hello',
          attachments: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'msg2',
          chatId: 'chat1',
          senderId: 'user2',
          content: 'Hi',
          attachments: null,
          createdAt: '2025-01-01T01:00:00.000Z',
        },
      ];

      const pipelineMock = {
        del: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      redisMock.pipeline.mockReturnValue(pipelineMock);

      await service.cacheMessages('chat1', messages);

      expect(redisMock.pipeline).toHaveBeenCalled();
      expect(pipelineMock.del).toHaveBeenCalledWith('messages:chat1');
      expect(pipelineMock.zadd).toHaveBeenCalledTimes(2);
      expect(pipelineMock.expire).toHaveBeenCalledWith('messages:chat1', 7200);
      expect(pipelineMock.exec).toHaveBeenCalled();
    });
  });

  describe('addMessageToCache', () => {
    it('should add message to sorted set and trim to 100', async () => {
      const message = {
        id: 'msg1',
        chatId: 'chat1',
        senderId: 'user1',
        content: 'Hello',
        attachments: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      await service.addMessageToCache('chat1', message);

      const score = new Date(message.createdAt).getTime();
      expect(redisMock.zadd).toHaveBeenCalledWith(
        'messages:chat1',
        score,
        JSON.stringify(message),
      );
      expect(redisMock.expire).toHaveBeenCalledWith('messages:chat1', 7200);
      expect(redisMock.zremrangebyrank).toHaveBeenCalledWith(
        'messages:chat1',
        0,
        -101,
      );
    });
  });

  describe('getCachedMessages', () => {
    it('should return cached messages', async () => {
      const messages = [
        JSON.stringify({
          id: 'msg1',
          chatId: 'chat1',
          senderId: 'user1',
          content: 'Hello',
          createdAt: '2025-01-01T00:00:00.000Z',
        }),
        JSON.stringify({
          id: 'msg2',
          chatId: 'chat1',
          senderId: 'user2',
          content: 'Hi',
          createdAt: '2025-01-01T01:00:00.000Z',
        }),
      ];

      redisMock.zrevrange.mockResolvedValue(messages);

      const result = await service.getCachedMessages('chat1', 50);

      expect(result).toHaveLength(2);
      expect(redisMock.zrevrange).toHaveBeenCalledWith(
        'messages:chat1',
        0,
        49,
      );
    });

    it('should return empty array when no messages', async () => {
      redisMock.zrevrange.mockResolvedValue([]);

      const result = await service.getCachedMessages('chat1');

      expect(result).toEqual([]);
    });
  });

  describe('getUserChatIds', () => {
    it('should return chat IDs for user', async () => {
      const keys = ['chat:chat1', 'chat:chat2', 'chat:chat3'];
      const chatDataArray = [
        JSON.stringify({
          id: 'chat1',
          participantIds: ['user1', 'user2'],
        }),
        JSON.stringify({
          id: 'chat2',
          participantIds: ['user1', 'user3'],
        }),
        JSON.stringify({
          id: 'chat3',
          participantIds: ['user4', 'user5'],
        }),
      ];

      redisMock.keys.mockResolvedValue(keys);
      redisMock.mget.mockResolvedValue(chatDataArray);

      const result = await service.getUserChatIds('user1');

      expect(result).toEqual(['chat1', 'chat2']);
      expect(redisMock.keys).toHaveBeenCalledWith('chat:*');
      expect(redisMock.mget).toHaveBeenCalledWith(keys);
    });

    it('should return empty array when no chats', async () => {
      redisMock.keys.mockResolvedValue([]);

      const result = await service.getUserChatIds('user1');

      expect(result).toEqual([]);
    });

    it('should skip malformed cache entries', async () => {
      const keys = ['chat:chat1', 'chat:chat2'];
      const chatDataArray = [
        JSON.stringify({
          id: 'chat1',
          participantIds: ['user1', 'user2'],
        }),
        'invalid json',
      ];

      redisMock.keys.mockResolvedValue(keys);
      redisMock.mget.mockResolvedValue(chatDataArray);

      const result = await service.getUserChatIds('user1');

      expect(result).toEqual(['chat1']);
    });
  });

  describe('updateMessageInCache', () => {
    it('should update message in cache', async () => {
      const allMessages = [
        JSON.stringify({
          id: 'msg1',
          chatId: 'chat1',
          senderId: 'user1',
          content: 'Hello',
          createdAt: '2025-01-01T00:00:00.000Z',
        }),
        JSON.stringify({
          id: 'msg2',
          chatId: 'chat1',
          senderId: 'user2',
          content: 'Hi',
          createdAt: '2025-01-01T01:00:00.000Z',
        }),
      ];

      redisMock.zrange.mockResolvedValue(allMessages);

      const pipelineMock = {
        zrem: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      redisMock.pipeline.mockReturnValue(pipelineMock);

      await service.updateMessageInCache('chat1', 'msg1', {
        content: 'Updated content',
      });

      expect(redisMock.zrange).toHaveBeenCalledWith('messages:chat1', 0, -1);
      expect(pipelineMock.zrem).toHaveBeenCalled();
      expect(pipelineMock.zadd).toHaveBeenCalled();
      expect(pipelineMock.expire).toHaveBeenCalledWith('messages:chat1', 7200);
    });

    it('should update attachments', async () => {
      const allMessages = [
        JSON.stringify({
          id: 'msg1',
          chatId: 'chat1',
          senderId: 'user1',
          content: 'Hello',
          attachments: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        }),
      ];

      redisMock.zrange.mockResolvedValue(allMessages);

      const pipelineMock = {
        zrem: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      redisMock.pipeline.mockReturnValue(pipelineMock);

      const attachments = [
        {
          name: 'file.pdf',
          url: 'https://example.com/file.pdf',
          category: 'document',
          mimeType: 'application/pdf',
          size: 1024,
        },
      ];

      await service.updateMessageInCache('chat1', 'msg1', {
        attachments,
      });

      expect(pipelineMock.zadd).toHaveBeenCalled();
    });

    it('should do nothing if message not in cache', async () => {
      redisMock.zrange.mockResolvedValue([]);

      await service.updateMessageInCache('chat1', 'msg1', {
        content: 'Updated',
      });

      expect(redisMock.zrange).toHaveBeenCalled();
      expect(redisMock.pipeline).not.toHaveBeenCalled();
    });

    it('should do nothing if no messages in cache', async () => {
      redisMock.zrange.mockResolvedValue(null);

      await service.updateMessageInCache('chat1', 'msg1', {
        content: 'Updated',
      });

      expect(redisMock.pipeline).not.toHaveBeenCalled();
    });
  });

  describe('setUserOnline', () => {
    it('should set user online status', async () => {
      await service.setUserOnline('user1', 'socket-id-123');

      expect(redisMock.set).toHaveBeenCalledWith(
        'presence:user1',
        'socket-id-123',
        300,
      );
    });
  });

  describe('setUserOffline', () => {
    it('should remove user online status', async () => {
      await service.setUserOffline('user1');

      expect(redisMock.del).toHaveBeenCalledWith('presence:user1');
    });
  });

  describe('isUserOnline', () => {
    it('should return true if user is online', async () => {
      // RedisService.exists returns boolean (result === 1)
      // So we need to mock it as boolean, but the underlying Redis client returns number
      // The service calls redis.exists which should return boolean after conversion
      redisMock.exists.mockResolvedValue(true);

      const result = await service.isUserOnline('user1');

      expect(result).toBe(true);
      expect(redisMock.exists).toHaveBeenCalledWith('presence:user1');
    });

    it('should return false if user is offline', async () => {
      redisMock.exists.mockResolvedValue(false);

      const result = await service.isUserOnline('user1');

      expect(result).toBe(false);
    });
  });

  describe('getUserSocketId', () => {
    it('should return socket ID if user is online', async () => {
      redisMock.get.mockResolvedValue('socket-id-123');

      const result = await service.getUserSocketId('user1');

      expect(result).toBe('socket-id-123');
      expect(redisMock.get).toHaveBeenCalledWith('presence:user1');
    });

    it('should return null if user is offline', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.getUserSocketId('user1');

      expect(result).toBeNull();
    });
  });

  describe('incrementUnreadCount', () => {
    it('should increment unread count', async () => {
      redisMock.incr.mockResolvedValue(5);

      const result = await service.incrementUnreadCount('user1', 'chat1');

      expect(result).toBe(5);
      expect(redisMock.incr).toHaveBeenCalledWith('unread:user1:chat1');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      redisMock.get.mockResolvedValue('5');

      const result = await service.getUnreadCount('user1', 'chat1');

      expect(result).toBe(5);
      expect(redisMock.get).toHaveBeenCalledWith('unread:user1:chat1');
    });

    it('should return 0 when no unread messages', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.getUnreadCount('user1', 'chat1');

      expect(result).toBe(0);
    });
  });

  describe('resetUnreadCount', () => {
    it('should reset unread count', async () => {
      await service.resetUnreadCount('user1', 'chat1');

      expect(redisMock.del).toHaveBeenCalledWith('unread:user1:chat1');
    });
  });

  describe('getAllUnreadCounts', () => {
    it('should return all unread counts for user', async () => {
      const keys = ['unread:user1:chat1', 'unread:user1:chat2'];
      const counts = ['5', '3'];

      redisMock.keys.mockResolvedValue(keys);
      redisMock.mget.mockResolvedValue(counts);

      const result = await service.getAllUnreadCounts('user1');

      expect(result).toEqual({
        chat1: 5,
        chat2: 3,
      });
      expect(redisMock.keys).toHaveBeenCalledWith('unread:user1:*');
      expect(redisMock.mget).toHaveBeenCalledWith(keys);
    });

    it('should return empty object when no unread counts', async () => {
      redisMock.keys.mockResolvedValue([]);

      const result = await service.getAllUnreadCounts('user1');

      expect(result).toEqual({});
    });

    it('should handle null counts', async () => {
      const keys = ['unread:user1:chat1', 'unread:user1:chat2'];
      const counts = ['5', null];

      redisMock.keys.mockResolvedValue(keys);
      redisMock.mget.mockResolvedValue(counts);

      const result = await service.getAllUnreadCounts('user1');

      expect(result).toEqual({
        chat1: 5,
        chat2: 0,
      });
    });
  });

  describe('checkRateLimit', () => {
    it('should return true when under limit', async () => {
      redisMock.incr.mockResolvedValue(5);

      const result = await service.checkRateLimit('user1', 10, 60);

      expect(result).toBe(true);
      expect(redisMock.incr).toHaveBeenCalledWith(
        'ratelimit:messages:user1',
      );
      // expire is only called on first increment (current === 1)
      // Since we mocked incr to return 5, expire won't be called
    });

    it('should return false when over limit', async () => {
      redisMock.incr.mockResolvedValue(11);

      const result = await service.checkRateLimit('user1', 10, 60);

      expect(result).toBe(false);
    });

    it('should set expiry only on first increment', async () => {
      redisMock.incr.mockResolvedValue(1); // First increment

      await service.checkRateLimit('user1', 10, 60);

      expect(redisMock.expire).toHaveBeenCalledWith(
        'ratelimit:messages:user1',
        60,
      );
      expect(redisMock.expire).toHaveBeenCalledTimes(1);
    });
  });

  describe('incrementConnectionAttempts', () => {
    it('should increment connection attempts', async () => {
      redisMock.incr.mockResolvedValue(1); // First attempt

      const result = await service.incrementConnectionAttempts('192.168.1.1', 60);

      expect(result).toBe(1);
      expect(redisMock.incr).toHaveBeenCalledWith(
        'ratelimit:ws_connect:192.168.1.1',
      );
      expect(redisMock.expire).toHaveBeenCalledWith(
        'ratelimit:ws_connect:192.168.1.1',
        60,
      );
    });

    it('should not set expiry on subsequent increments', async () => {
      redisMock.incr.mockResolvedValue(3); // Subsequent attempt

      const result = await service.incrementConnectionAttempts('192.168.1.1', 60);

      expect(result).toBe(3);
      expect(redisMock.incr).toHaveBeenCalledWith(
        'ratelimit:ws_connect:192.168.1.1',
      );
      // expire is only called when result === 1
      expect(redisMock.expire).not.toHaveBeenCalled();
    });
  });

  describe('clearConnectionAttempts', () => {
    it('should clear connection attempts', async () => {
      await service.clearConnectionAttempts('192.168.1.1');

      expect(redisMock.del).toHaveBeenCalledWith(
        'ratelimit:ws_connect:192.168.1.1',
      );
    });
  });

  describe('markAsDeleted', () => {
    it('should mark chat as deleted', async () => {
      const deletedAt = '2025-01-01T00:00:00.000Z';

      await service.markAsDeleted('user1', 'chat1', deletedAt);

      expect(redisMock.sadd).toHaveBeenCalledWith('deleted:user1', 'chat1');
      expect(redisMock.set).toHaveBeenCalledWith(
        'deleted:user1:chat1:at',
        deletedAt,
      );
    });
  });

  describe('getDeletedChats', () => {
    it('should return deleted chat IDs', async () => {
      redisMock.smembers.mockResolvedValue(['chat1', 'chat2']);

      const result = await service.getDeletedChats('user1');

      expect(result).toEqual(['chat1', 'chat2']);
      expect(redisMock.smembers).toHaveBeenCalledWith('deleted:user1');
    });
  });

  describe('getDeletedAt', () => {
    it('should return deleted timestamp', async () => {
      redisMock.get.mockResolvedValue('2025-01-01T00:00:00.000Z');

      const result = await service.getDeletedAt('user1', 'chat1');

      expect(result).toBe('2025-01-01T00:00:00.000Z');
      expect(redisMock.get).toHaveBeenCalledWith('deleted:user1:chat1:at');
    });

    it('should return null when not deleted', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.getDeletedAt('user1', 'chat1');

      expect(result).toBeNull();
    });
  });

  describe('removeFromDeleted', () => {
    it('should remove chat from deleted set', async () => {
      await service.removeFromDeleted('user1', 'chat1');

      expect(redisMock.srem).toHaveBeenCalledWith('deleted:user1', 'chat1');
      expect(redisMock.del).toHaveBeenCalledWith('deleted:user1:chat1:at');
    });
  });

  describe('cacheChatMetadata', () => {
    it('should cache chat metadata', async () => {
      const metadata = {
        participantIds: ['user1', 'user2'],
        status: ChatStatus.ACCEPTED,
        companyId: 'user1',
        playerId: 'user2',
      };

      await service.cacheChatMetadata('chat1', metadata);

      expect(redisMock.set).toHaveBeenCalledWith(
        'chat:meta:chat1',
        JSON.stringify(metadata),
        300,
      );
    });
  });

  describe('getChatMetadata', () => {
    it('should return cached metadata', async () => {
      const metadata = {
        participantIds: ['user1', 'user2'],
        status: ChatStatus.ACCEPTED,
        companyId: 'user1',
        playerId: 'user2',
      };

      redisMock.get.mockResolvedValue(JSON.stringify(metadata));

      const result = await service.getChatMetadata('chat1');

      expect(result).toEqual(metadata);
      expect(redisMock.get).toHaveBeenCalledWith('chat:meta:chat1');
    });

    it('should return null when not cached', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.getChatMetadata('chat1');

      expect(result).toBeNull();
    });
  });

  describe('cacheParticipantVerification', () => {
    it('should cache participant verification as true', async () => {
      await service.cacheParticipantVerification('chat1', 'user1', true);

      expect(redisMock.set).toHaveBeenCalledWith(
        'participant:chat1:user1',
        '1',
        300,
      );
    });

    it('should cache participant verification as false', async () => {
      await service.cacheParticipantVerification('chat1', 'user1', false);

      expect(redisMock.set).toHaveBeenCalledWith(
        'participant:chat1:user1',
        '0',
        300,
      );
    });
  });

  describe('isParticipantCached', () => {
    it('should return true when participant', async () => {
      redisMock.get.mockResolvedValue('1');

      const result = await service.isParticipantCached('chat1', 'user1');

      expect(result).toBe(true);
      expect(redisMock.get).toHaveBeenCalledWith('participant:chat1:user1');
    });

    it('should return false when not participant', async () => {
      redisMock.get.mockResolvedValue('0');

      const result = await service.isParticipantCached('chat1', 'user1');

      expect(result).toBe(false);
    });

    it('should return null when not cached', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.isParticipantCached('chat1', 'user1');

      expect(result).toBeNull();
    });
  });

  describe('invalidateChatMetadata', () => {
    it('should invalidate metadata and participant caches', async () => {
      const participantKeys = [
        'participant:chat1:user1',
        'participant:chat1:user2',
      ];
      redisMock.keys.mockResolvedValue(participantKeys);

      const pipelineMock = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      redisMock.pipeline.mockReturnValue(pipelineMock);

      await service.invalidateChatMetadata('chat1');

      expect(redisMock.del).toHaveBeenCalledWith('chat:meta:chat1');
      expect(redisMock.keys).toHaveBeenCalledWith('participant:chat1:*');
      expect(pipelineMock.del).toHaveBeenCalledTimes(2);
      expect(pipelineMock.exec).toHaveBeenCalled();
    });

    it('should handle no participant keys', async () => {
      redisMock.keys.mockResolvedValue([]);

      await service.invalidateChatMetadata('chat1');

      expect(redisMock.del).toHaveBeenCalledWith('chat:meta:chat1');
      expect(redisMock.keys).toHaveBeenCalledWith('participant:chat1:*');
      expect(redisMock.pipeline).not.toHaveBeenCalled();
    });
  });
});

