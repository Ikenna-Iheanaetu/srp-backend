import { Test, TestingModule } from '@nestjs/testing';
import { MessageIdResolverService } from './message-id-resolver.service';
import { RedisService } from '../../redis/redis.service';

const redisMock = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  pipeline: jest.fn(),
};

describe('MessageIdResolverService', () => {
  let service: MessageIdResolverService;
  let redisService: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageIdResolverService,
        {
          provide: RedisService,
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<MessageIdResolverService>(MessageIdResolverService);
    redisService = module.get<RedisService>(RedisService);

    // Mock sleep to make tests faster
    jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);
  });

  describe('registerPendingTempId', () => {
    it('should register a pending temp ID', async () => {
      await service.registerPendingTempId('temp_1234567890_abc');

      expect(redisMock.set).toHaveBeenCalledWith(
        'message:temp:temp_1234567890_abc',
        'pending',
        30,
      );
    });

    it('should handle errors during registration', async () => {
      const error = new Error('Redis error');
      redisMock.set.mockRejectedValueOnce(error);

      await expect(
        service.registerPendingTempId('temp_1234567890_abc'),
      ).rejects.toThrow('Redis error');
      
      // Reset mock for other tests
      redisMock.set.mockResolvedValue(undefined);
    });
  });

  describe('storeTempIdMapping', () => {
    it('should store mapping from temp ID to real ID', async () => {
      await service.storeTempIdMapping(
        'temp_1234567890_abc',
        '507f1f77bcf86cd799439011',
      );

      expect(redisMock.set).toHaveBeenCalledWith(
        'message:temp:temp_1234567890_abc',
        '507f1f77bcf86cd799439011',
        30,
      );
    });

    it('should handle errors during storage', async () => {
      const error = new Error('Redis error');
      redisMock.set.mockRejectedValueOnce(error);

      await expect(
        service.storeTempIdMapping(
          'temp_1234567890_abc',
          '507f1f77bcf86cd799439011',
        ),
      ).rejects.toThrow('Redis error');
      
      // Reset mock for other tests
      redisMock.set.mockResolvedValue(undefined);
    });
  });

  describe('resolveToRealId', () => {
    it('should return valid ObjectId immediately', async () => {
      const result = await service.resolveToRealId(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe('507f1f77bcf86cd799439011');
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('should resolve temp ID to real ID when available', async () => {
      redisMock.get.mockResolvedValue('507f1f77bcf86cd799439011');

      const result = await service.resolveToRealId('temp_1234567890_abc');

      expect(result).toBe('507f1f77bcf86cd799439011');
      expect(redisMock.get).toHaveBeenCalledWith(
        'message:temp:temp_1234567890_abc',
      );
    });

    it('should poll for pending temp ID and resolve', async () => {
      // First call returns pending, second call returns real ID
      redisMock.get
        .mockResolvedValueOnce('pending')
        .mockResolvedValueOnce('507f1f77bcf86cd799439011');

      const result = await service.resolveToRealId('temp_1234567890_abc', 1000);

      expect(result).toBe('507f1f77bcf86cd799439011');
      expect(redisMock.get).toHaveBeenCalledTimes(2);
      expect((service as any).sleep).toHaveBeenCalled();
    });

    it('should return null when temp ID not found', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.resolveToRealId('temp_1234567890_abc');

      expect(result).toBeNull();
    });

    it('should return null on timeout', async () => {
      redisMock.get.mockResolvedValue('pending');

      const result = await service.resolveToRealId('temp_1234567890_abc', 50);

      expect(result).toBeNull();
    });

    it('should handle errors during resolution', async () => {
      const error = new Error('Redis error');
      redisMock.get.mockRejectedValue(error);

      const result = await service.resolveToRealId('temp_1234567890_abc');

      expect(result).toBeNull();
    });

    it('should handle polling multiple times until resolved', async () => {
      redisMock.get
        .mockResolvedValueOnce('pending')
        .mockResolvedValueOnce('pending')
        .mockResolvedValueOnce('507f1f77bcf86cd799439011');

      const result = await service.resolveToRealId('temp_1234567890_abc', 500);

      expect(result).toBe('507f1f77bcf86cd799439011');
      expect(redisMock.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('isValidObjectId', () => {
    it('should return true for valid ObjectId', () => {
      expect(
        service.isValidObjectId('507f1f77bcf86cd799439011'),
      ).toBe(true);
      expect(
        service.isValidObjectId('000000000000000000000000'),
      ).toBe(true);
      expect(
        service.isValidObjectId('ffffffffffffffffffffffff'),
      ).toBe(true);
    });

    it('should return false for invalid ObjectId', () => {
      expect(service.isValidObjectId('invalid')).toBe(false);
      expect(service.isValidObjectId('123')).toBe(false);
      expect(service.isValidObjectId('507f1f77bcf86cd79943901')).toBe(false); // Too short
      expect(
        service.isValidObjectId('507f1f77bcf86cd7994390111'),
      ).toBe(false); // Too long
      expect(service.isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false); // Invalid char
    });

    it('should return false for non-string values', () => {
      expect(service.isValidObjectId(null as any)).toBe(false);
      expect(service.isValidObjectId(undefined as any)).toBe(false);
      expect(service.isValidObjectId(123 as any)).toBe(false);
      expect(service.isValidObjectId({} as any)).toBe(false);
      expect(service.isValidObjectId('')).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up temp ID mapping', async () => {
      await service.cleanup('temp_1234567890_abc');

      expect(redisMock.del).toHaveBeenCalledWith(
        'message:temp:temp_1234567890_abc',
      );
    });

    it('should handle errors during cleanup', async () => {
      const error = new Error('Redis error');
      redisMock.del.mockRejectedValue(error);

      // Should not throw
      await service.cleanup('temp_1234567890_abc');

      expect(redisMock.del).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return stats for all temp IDs', async () => {
      const keys = [
        'message:temp:temp1',
        'message:temp:temp2',
        'message:temp:temp3',
      ];
      const pipelineMock = {
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'pending'],
          [null, '507f1f77bcf86cd799439011'],
          [null, 'pending'],
        ]),
      };

      redisMock.keys.mockResolvedValue(keys);
      redisMock.pipeline.mockReturnValue(pipelineMock);

      const result = await service.getStats();

      expect(result).toEqual({
        totalMappings: 3,
        pendingCount: 2,
        resolvedCount: 1,
      });
      expect(redisMock.keys).toHaveBeenCalledWith('message:temp:*');
      expect(pipelineMock.get).toHaveBeenCalledTimes(3);
      expect(pipelineMock.exec).toHaveBeenCalled();
    });

    it('should return zero stats when no temp IDs', async () => {
      redisMock.keys.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result).toEqual({
        totalMappings: 0,
        pendingCount: 0,
        resolvedCount: 0,
      });
    });

    it('should handle errors in stats', async () => {
      const error = new Error('Redis error');
      redisMock.keys.mockRejectedValue(error);

      const result = await service.getStats();

      expect(result).toEqual({
        totalMappings: 0,
        pendingCount: 0,
        resolvedCount: 0,
      });
    });

    it('should handle pipeline errors in stats', async () => {
      const keys = ['message:temp:temp1'];
      const pipelineMock = {
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[new Error('Redis error'), null]]),
      };

      redisMock.keys.mockResolvedValue(keys);
      redisMock.pipeline.mockReturnValue(pipelineMock);

      const result = await service.getStats();

      expect(result).toEqual({
        totalMappings: 1,
        pendingCount: 0,
        resolvedCount: 0,
      });
    });

    it('should handle null values in pipeline results', async () => {
      const keys = ['message:temp:temp1', 'message:temp:temp2'];
      const pipelineMock = {
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'pending'],
          [null, null],
        ]),
      };

      redisMock.keys.mockResolvedValue(keys);
      redisMock.pipeline.mockReturnValue(pipelineMock);

      const result = await service.getStats();

      expect(result).toEqual({
        totalMappings: 2,
        pendingCount: 1,
        resolvedCount: 0,
      });
    });
  });

  describe('getTempIdKey', () => {
    it('should generate correct Redis key', () => {
      const key = (service as any).getTempIdKey('temp_123');
      expect(key).toBe('message:temp:temp_123');
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      jest.restoreAllMocks();
      const sleepSpy = jest.spyOn(global, 'setTimeout');

      await (service as any).sleep(100);

      expect(sleepSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    });
  });

  describe('edge cases', () => {
    it('should handle empty temp ID', async () => {
      // Empty string is not a valid ObjectId, so it will try to resolve
      redisMock.get.mockResolvedValue(null);
      
      const result = await service.resolveToRealId('');

      expect(redisMock.get).toHaveBeenCalledWith('message:temp:');
      expect(result).toBeNull();
    });

    it('should handle very long timeout', async () => {
      redisMock.get.mockResolvedValue('pending');

      const result = await service.resolveToRealId('temp_123', 100000);

      expect(result).toBeNull();
      // Should have made multiple attempts (limited by max attempts)
      expect(redisMock.get).toHaveBeenCalled();
    });

    it('should handle ObjectId with uppercase letters', () => {
      expect(
        service.isValidObjectId('507F1F77BCF86CD799439011'),
      ).toBe(true);
    });

    it('should handle mixed case ObjectId', () => {
      expect(
        service.isValidObjectId('507F1F77bcf86CD799439011'),
      ).toBe(true);
    });
  });
});

