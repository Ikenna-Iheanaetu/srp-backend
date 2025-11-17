// Stub utils barrel to avoid importing nanoid ESM during tests
jest.mock('src/utils', () => ({
  CodeGeneratorService: class {},
  OtpUtilsService: class {},
}));

// Mock bcrypt to control password hashing/comparison in tests
jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed'),
  compare: jest.fn(async () => true),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { GOOGLE_OAUTH_CLIENT, REFRESH_JWT_SERVICE } from './auth.providers';
import { OAuth2Client } from 'google-auth-library';
import { CodeGeneratorService, OtpUtilsService } from 'src/utils';
import { OtpType } from '@prisma/client';

const prismaMock = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  admin: { create: jest.fn() },
  company: { create: jest.fn() },
  player: { create: jest.fn(), updateMany: jest.fn() },
  club: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  affiliate: { findFirst: jest.fn(), create: jest.fn() },
  notification: {
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  otpCode: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const jwtMock: Partial<JwtService> = {
  signAsync: jest.fn().mockResolvedValue('jwt'),
  sign: jest.fn(),
  verifyAsync: jest.fn(),
  verify: jest.fn(),
};

const jwtRefreshMock: Partial<JwtService> = {
  sign: jest.fn().mockReturnValue('refreshJwt'),
  signAsync: jest.fn().mockResolvedValue('refreshJwt'),
  verifyAsync: jest.fn().mockResolvedValue({ userId: 'u1' }),
  verify: jest.fn().mockReturnValue({
    userId: 'u1',
    profileId: 'profile-id',
    iat: Date.now() / 1000,
  }),
};

const emailMock: Partial<EmailService> = {
  sendPasswordResetEmail: jest.fn(),
  sendPasswordResetConfirmationEmail: jest.fn(),
};

const configMock: Partial<ConfigService> = {
  get: jest.fn().mockReturnValue('value'),
};

const googleMock = {
  verifyIdToken: jest.fn().mockResolvedValue({
    getPayload: () => ({ email: 'g@x.com', name: 'G', sub: 'sub' }),
  }),
} as unknown as OAuth2Client;

const codeGenMock: Partial<CodeGeneratorService> = {
  generateUniqueRefCode: jest.fn().mockReturnValue('ABC123'),
};

const otpUtilsMock: Partial<OtpUtilsService> = {
  generateAndSaveOtp: jest.fn().mockResolvedValue('123456'),
  verifyOtp: jest.fn().mockResolvedValue({
    id: 'otp1',
    email: 'a@a.com',
    type: 'EMAIL_VERIFICATION',
    status: 'ACTIVE',
    user: { id: 'u1', email: 'a@a.com', userType: 'PLAYER', status: 'PENDING' },
    expiresAt: new Date(Date.now() + 60_000),
    attempts: 0,
    maxAttempts: 5,
  } as any),
};

const mockProfile = {
  id: 'profile-id',
  name: 'John Doe',
  avatar: null,
  onboardingSteps: [],
} as any;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (prismaMock.refreshToken.findFirst as jest.Mock).mockResolvedValue({
      tokenHash: 'th',
      userId: 'u1',
    });
    (prismaMock.refreshToken.updateMany as jest.Mock).mockResolvedValue({
      count: 1,
    });

    (prismaMock.club.findFirst as jest.Mock).mockResolvedValue({
      id: 'club1',
      refCode: 'REF1',
    });

    (prismaMock.notification.create as jest.Mock).mockResolvedValue({
      id: 'notif1',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: EmailService, useValue: emailMock },
        { provide: ConfigService, useValue: configMock },
        { provide: CodeGeneratorService, useValue: codeGenMock },
        { provide: OtpUtilsService, useValue: otpUtilsMock },
        { provide: REFRESH_JWT_SERVICE, useValue: jwtRefreshMock },
        { provide: GOOGLE_OAUTH_CLIENT, useValue: googleMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    const bcrypt = require('bcrypt');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    (service as any).googleClient.verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => ({ email: 'g@x.com', name: 'G', sub: 'sub' }),
    });

    jest
      .spyOn(service as any, 'getUserProfileData')
      .mockResolvedValue(mockProfile);
    jest
      .spyOn(service as any, 'generateTokenPair')
      .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
    jest
      .spyOn(service as any, 'validateSignupRequest')
      .mockResolvedValue(undefined);
    jest.spyOn(service as any, 'createProfile').mockResolvedValue({
      id: 'profile-id',
      avatar: null,
      onboardingSteps: [],
    } as any);
    jest.spyOn(service as any, 'handleRefCode').mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'sendVerificationEmailAsync')
      .mockImplementation(() => undefined);

    jest
      .spyOn(service as any, 'createLoginNotificationAsync')
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(service as any, 'sendPasswordResetEmailAsync')
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(service as any, 'sendPasswordResetConfirmationAsync')
      .mockImplementation(() => Promise.resolve());
  });

  describe('verifyAccount', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'cleanupOldTokens').mockResolvedValue(undefined);
    });

    it('activates PENDING user and returns tokens', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        user: {
          id: 'u1',
          email: 'a@a.com',
          userType: 'PLAYER',
          status: 'PENDING',
        },
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
        maxAttempts: 5,
      });
      prismaMock.$transaction.mockImplementation(async (fn) =>
        fn({
          user: {
            update: jest.fn().mockResolvedValue({
              id: 'u1',
              email: 'a@a.com',
              userType: 'PLAYER',
              status: 'ACTIVE',
            }),
          },
          affiliate: { findFirst: jest.fn().mockResolvedValue(null) },
          player: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        }),
      );

      const res = await service.verifyAccount({
        otp: '123456',
        email: 'a@a.com',
      } as any);

      expect(res.success).toBe(true);
      expect(res.message).toBe('Account verified successfully');
      expect(res.data.accessToken).toBe('access');
      expect(res.data.refreshToken).toBe('refresh');
      expect(res.data.user).toEqual(mockProfile);
      expect(otpUtilsMock.verifyOtp).toHaveBeenCalledWith(
        'a@a.com',
        '123456',
        OtpType.EMAIL_VERIFICATION,
      );
    });

    it('returns tokens immediately if user already ACTIVE', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        user: {
          id: 'u1',
          email: 'a@a.com',
          userType: 'PLAYER',
          status: 'ACTIVE',
        },
      });

      const res = await service.verifyAccount({
        otp: '123456',
        email: 'a@a.com',
      } as any);

      expect(res.success).toBe(true);
      expect(res.message).toBe('Account already verified');
      expect(res.data.accessToken).toBeDefined();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('calls cleanupOldTokens after generating tokens', async () => {
      const cleanupSpy = jest
        .spyOn(service as any, 'cleanupOldTokens')
        .mockResolvedValue(undefined);

      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        user: {
          id: 'u1',
          email: 'a@a.com',
          userType: 'PLAYER',
          status: 'PENDING',
        },
      });
      prismaMock.$transaction.mockImplementation(async (fn) =>
        fn({
          user: {
            update: jest.fn().mockResolvedValue({
              id: 'u1',
              email: 'a@a.com',
              userType: 'PLAYER',
              status: 'ACTIVE',
            }),
          },
          affiliate: { findFirst: jest.fn().mockResolvedValue(null) },
          player: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        }),
      );

      await service.verifyAccount({
        otp: '123456',
        email: 'a@a.com',
      } as any);

      expect(cleanupSpy).toHaveBeenCalledWith('u1');
    });

    it('updates PLAYER clubId when affiliate with club exists', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        user: {
          id: 'u1',
          email: 'a@a.com',
          userType: 'PLAYER',
          status: 'PENDING',
        },
      });

      const playerUpdateSpy = jest.fn().mockResolvedValue({ count: 1 });
      prismaMock.$transaction.mockImplementation(async (fn) =>
        fn({
          user: {
            update: jest.fn().mockResolvedValue({
              id: 'u1',
              email: 'a@a.com',
              userType: 'PLAYER',
              status: 'ACTIVE',
            }),
          },
          affiliate: {
            findFirst: jest
              .fn()
              .mockResolvedValue({ id: 'aff1', clubId: 'club1' }),
          },
          player: { updateMany: playerUpdateSpy },
        }),
      );

      await service.verifyAccount({
        otp: '123456',
        email: 'a@a.com',
      } as any);

      expect(playerUpdateSpy).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { clubId: 'club1' },
      });
    });

    it('activates SUPPORTER user without updating clubId', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        user: {
          id: 'u2',
          email: 'supporter@a.com',
          userType: 'SUPPORTER',
          status: 'PENDING',
        },
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
        maxAttempts: 5,
      });

      const playerUpdateSpy = jest.fn().mockResolvedValue({ count: 0 });
      prismaMock.$transaction.mockImplementation(async (fn) =>
        fn({
          user: {
            update: jest.fn().mockResolvedValue({
              id: 'u2',
              email: 'supporter@a.com',
              userType: 'SUPPORTER',
              status: 'ACTIVE',
            }),
          },
          affiliate: {
            findFirst: jest
              .fn()
              .mockResolvedValue({ id: 'aff2', clubId: 'club1' }),
          },
          player: { updateMany: playerUpdateSpy },
        }),
      );

      await service.verifyAccount({
        otp: '123456',
        email: 'supporter@a.com',
      } as any);

      // SUPPORTER should NOT update player clubId
      expect(playerUpdateSpy).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user not found in OTP', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        user: null,
      });

      await expect(
        service.verifyAccount({
          otp: '123456',
          email: 'a@a.com',
        } as any),
      ).rejects.toThrow('User not found');
    });

    it('throws UnauthorizedException for invalid OTP', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockRejectedValueOnce(
        new UnauthorizedException('Invalid OTP'),
      );

      await expect(
        service.verifyAccount({ otp: '999999', email: 'a@a.com' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockRejectedValueOnce(
        new Error('DB error'),
      );

      await expect(
        service.verifyAccount({ otp: '123456', email: 'a@a.com' } as any),
      ).rejects.toThrow('Failed to verify account');
    });

    it('does not update clubId for SUPPORTER even when affiliate exists', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        user: {
          id: 'u2',
          email: 'supporter@a.com',
          userType: 'SUPPORTER',
          status: 'PENDING',
        },
      });

      const playerUpdateSpy = jest.fn().mockResolvedValue({ count: 0 });
      prismaMock.$transaction.mockImplementation(async (fn) =>
        fn({
          user: {
            update: jest.fn().mockResolvedValue({
              id: 'u2',
              email: 'supporter@a.com',
              userType: 'SUPPORTER',
              status: 'ACTIVE',
            }),
          },
          affiliate: {
            findFirst: jest
              .fn()
              .mockResolvedValue({ id: 'aff2', clubId: 'club1' }),
          },
          player: { updateMany: playerUpdateSpy },
        }),
      );

      await service.verifyAccount({
        otp: '123456',
        email: 'supporter@a.com',
      } as any);

      // SUPPORTER should NOT update player clubId
      expect(playerUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('signup', () => {
    beforeEach(() => {
      prismaMock.$transaction.mockImplementation(async (fn) =>
        fn({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'u1',
              email: 'x@x.com',
              userType: 'PLAYER',
            }),
          },
          player: {
            create: jest.fn().mockResolvedValue({
              id: 'p1',
              avatar: null,
              onboardingSteps: [],
            }),
          },
          company: { create: jest.fn() },
          club: { create: jest.fn() },
          admin: { create: jest.fn() },
          affiliate: { create: jest.fn() },
        }),
      );
      jest.spyOn(service as any, 'cleanupOldTokens').mockResolvedValue(undefined);
    });

    it('creates PLAYER user, profile, sends email, returns tokens', async () => {
      const res = await service.signup({
        name: 'John Player',
        userType: 'PLAYER',
        email: 'player@x.com',
        password: 'Pass#123',
        refCode: 'REF1',
      } as any);

      expect(res.success).toBe(true);
      expect((service as any).sendVerificationEmailAsync).toHaveBeenCalled();
      expect(res.data.accessToken).toBeDefined();
      expect(res.data.refreshToken).toBeDefined();
      expect(res.data.user).toEqual(mockProfile);
      expect(res.message).toContain('Verification email sent');
    });

    it('creates COMPANY user successfully', async () => {
      prismaMock.$transaction.mockImplementationOnce(async (fn) =>
        fn({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'u2',
              email: 'company@x.com',
              userType: 'COMPANY',
            }),
          },
          company: {
            create: jest.fn().mockResolvedValue({
              id: 'c1',
              avatar: null,
              onboardingSteps: [],
            }),
          },
          player: { create: jest.fn() },
          club: { create: jest.fn() },
          admin: { create: jest.fn() },
          affiliate: { create: jest.fn() },
        }),
      );

      const res = await service.signup({
        name: 'Test Company',
        userType: 'COMPANY',
        email: 'company@x.com',
        password: 'Pass#123',
        refCode: 'REF1',
      } as any);

      expect(res.success).toBe(true);
      expect(res.data.accessToken).toBeDefined();
    });

    it('creates CLUB user successfully by updating existing pending user', async () => {
      prismaMock.$transaction.mockImplementationOnce(async (fn) =>
        fn({
          user: {
            update: jest.fn().mockResolvedValue({
              id: 'u3',
              email: 'club@x.com',
              userType: 'CLUB',
              status: 'ACTIVE',
            }),
          },
          club: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'club1',
              refCode: 'REF1',
              userId: 'u3',
              onboardingSteps: [],
            }),
          },
          player: { create: jest.fn() },
          company: { create: jest.fn() },
          admin: { create: jest.fn() },
          affiliate: { create: jest.fn() },
        }),
      );

      const res = await service.signup({
        name: 'Test Club',
        userType: 'CLUB',
        email: 'club@x.com',
        password: 'Pass#123',
      } as any);

      expect(res.success).toBe(true);
      expect(res.data.accessToken).toBeDefined();
    });

    it('throws error when CLUB profile not found for invited user', async () => {
      prismaMock.$transaction.mockImplementationOnce(async (fn) =>
        fn({
          user: {
            update: jest.fn().mockResolvedValue({
              id: 'u3',
              email: 'club@x.com',
              userType: 'CLUB',
            }),
          },
          club: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          player: { create: jest.fn() },
          company: { create: jest.fn() },
          admin: { create: jest.fn() },
          affiliate: { create: jest.fn() },
        }),
      );

      await expect(
        service.signup({
          name: 'Test Club',
          userType: 'CLUB',
          email: 'club@x.com',
          password: 'Pass#123',
        } as any),
      ).rejects.toThrow('Club profile not found for invited user');
    });

    it('creates SUPPORTER user successfully', async () => {
      prismaMock.$transaction.mockImplementationOnce(async (fn) =>
        fn({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'u4',
              email: 'supporter@x.com',
              userType: 'SUPPORTER',
            }),
          },
          player: {
            create: jest.fn().mockResolvedValue({
              id: 's1',
              avatar: null,
              onboardingSteps: [],
            }),
          },
          company: { create: jest.fn() },
          club: { create: jest.fn() },
          admin: { create: jest.fn() },
          affiliate: { create: jest.fn() },
        }),
      );

      const res = await service.signup({
        name: 'Test Supporter',
        userType: 'SUPPORTER',
        email: 'supporter@x.com',
        password: 'Pass#123',
        refCode: 'REF1',
      } as any);

      expect(res.success).toBe(true);
      expect(res.data.accessToken).toBeDefined();
    });

    it('calls cleanupOldTokens after token generation', async () => {
      const cleanupSpy = jest
        .spyOn(service as any, 'cleanupOldTokens')
        .mockResolvedValue(undefined);

      await service.signup({
        name: 'A',
        userType: 'PLAYER',
        email: 'x@x.com',
        password: 'Pass#123',
        refCode: 'REF1',
      } as any);

      expect(cleanupSpy).toHaveBeenCalledWith('u1');
    });

    it('generates OTP for email verification', async () => {
      await service.signup({
        name: 'A',
        userType: 'PLAYER',
        email: 'x@x.com',
        password: 'Pass#123',
        refCode: 'REF1',
      } as any);

      expect(otpUtilsMock.generateAndSaveOtp).toHaveBeenCalledWith(
        'x@x.com',
        OtpType.EMAIL_VERIFICATION,
        'u1',
      );
    });

    it('handles validation errors from validateSignupRequest', async () => {
      jest
        .spyOn(service as any, 'validateSignupRequest')
        .mockRejectedValueOnce(
          new Error('Invalid refCode'),
        );

      await expect(
        service.signup({
          name: 'A',
          userType: 'PLAYER',
          email: 'x@x.com',
          password: 'Pass#123',
          refCode: 'INVALID',
        } as any),
      ).rejects.toThrow();
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      prismaMock.$transaction.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.signup({
          name: 'A',
          userType: 'PLAYER',
          email: 'x@x.com',
          password: 'Pass#123',
          refCode: 'REF1',
        } as any),
      ).rejects.toThrow('Failed to create account');
    });

    it('throws InternalServerErrorException when profile creation fails for non-club', async () => {
      jest
        .spyOn(service as any, 'createProfile')
        .mockResolvedValueOnce(null);

      prismaMock.$transaction.mockImplementationOnce(async (fn) =>
        fn({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'u1',
              email: 'x@x.com',
              userType: 'PLAYER',
            }),
          },
          player: { create: jest.fn() },
          company: { create: jest.fn() },
          club: { create: jest.fn() },
          admin: { create: jest.fn() },
          affiliate: { create: jest.fn() },
        }),
      );

      await expect(
        service.signup({
          name: 'A',
          userType: 'PLAYER',
          email: 'x@x.com',
          password: 'Pass#123',
          refCode: 'REF1',
        } as any),
      ).rejects.toThrow('Failed to create user profile');
    });
  });

  describe('login', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'cleanupOldTokens').mockResolvedValue(undefined);
    });

    it('returns tokens on valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        password: 'hashed',
        userType: 'PLAYER',
        status: 'ACTIVE',
        useGoogle: false,
      });

      const res = await service.login({
        email: 'x@x.com',
        password: 'Pass#123',
      } as any);

      expect(res.success).toBe(true);
      expect(res.data.accessToken).toBe('access');
      expect(res.data.refreshToken).toBe('refresh');
      expect(res.data.user).toBeDefined();
    });

    it('throws UnauthorizedException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@x.com',
          password: 'Pass#123',
        } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is incorrect', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        password: 'hashed',
        userType: 'PLAYER',
        status: 'ACTIVE',
      });

      await expect(
        service.login({
          email: 'x@x.com',
          password: 'WrongPass#123',
        } as any),
      ).rejects.toThrow(UnauthorizedException);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('throws UnauthorizedException for Google-only accounts', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        password: null,
        userType: 'PLAYER',
        status: 'ACTIVE',
        useGoogle: true,
      });

      await expect(
        service.login({
          email: 'x@x.com',
          password: 'Pass#123',
        } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('calls cleanupOldTokens after successful login', async () => {
      const cleanupSpy = jest
        .spyOn(service as any, 'cleanupOldTokens')
        .mockResolvedValue(undefined);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        password: 'hashed',
        userType: 'PLAYER',
        status: 'ACTIVE',
      });

      await service.login({
        email: 'x@x.com',
        password: 'Pass#123',
      } as any);

      expect(cleanupSpy).toHaveBeenCalledWith('u1');
    });

    it('creates login notification after successful login', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        password: 'hashed',
        userType: 'PLAYER',
        status: 'ACTIVE',
      });

      await service.login({
        email: 'x@x.com',
        password: 'Pass#123',
      } as any);

      expect((service as any).createLoginNotificationAsync).toHaveBeenCalledWith('u1');
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.login({
          email: 'x@x.com',
          password: 'Pass#123',
        } as any),
      ).rejects.toThrow('Login failed');
    });
  });

  describe('resendOtp', () => {
    it('generates new otp and sends email for PENDING user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        status: 'PENDING',
      });

      const res = await service.resendOtp({ email: 'x@x.com' } as any);

      expect(res.success).toBe(true);
      expect(res.message).toBe('OTP resent successfully');
      expect(otpUtilsMock.generateAndSaveOtp).toHaveBeenCalledWith(
        'x@x.com',
        OtpType.EMAIL_VERIFICATION,
        'u1',
      );
      expect((service as any).sendVerificationEmailAsync).toHaveBeenCalledWith(
        'x@x.com',
        '123456',
      );
    });

    it('throws BadRequestException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resendOtp({ email: 'notfound@x.com' } as any),
      ).rejects.toThrow('This email does not exist');
    });

    it('throws BadRequestException when account is already verified', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        status: 'ACTIVE',
      });

      await expect(
        service.resendOtp({ email: 'x@x.com' } as any),
      ).rejects.toThrow('Account is already verified');
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.resendOtp({ email: 'x@x.com' } as any),
      ).rejects.toThrow('Failed to resend OTP');
    });
  });

  describe('forgotPassword', () => {
    it('sends reset otp for valid user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        status: 'ACTIVE',
        useGoogle: false,
      });

      const res = await service.forgotPassword({ email: 'x@x.com' } as any);

      expect(res.success).toBe(true);
      expect(res.message).toContain('password reset otp has been sent');
      expect(otpUtilsMock.generateAndSaveOtp).toHaveBeenCalledWith(
        'x@x.com',
        OtpType.PASSWORD_RESET,
        'u1',
      );
      expect((service as any).sendPasswordResetEmailAsync).toHaveBeenCalled();
    });

    it('throws UnauthorizedException when email not provided', async () => {
      await expect(
        service.forgotPassword({ email: '' } as any),
      ).rejects.toThrow('Email is required');
    });

    it('throws UnauthorizedException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'notfound@x.com' } as any),
      ).rejects.toThrow('User not found');
    });

    it('throws BadRequestException for Google accounts', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'google@x.com',
        status: 'ACTIVE',
        useGoogle: true,
      });

      await expect(
        service.forgotPassword({ email: 'google@x.com' } as any),
      ).rejects.toThrow('Google account cannot reset password');
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.forgotPassword({ email: 'x@x.com' } as any),
      ).rejects.toThrow('Failed to process password reset request');
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid reset token', async () => {
      (jwtMock.verify as jest.Mock).mockReturnValueOnce({
        sub: 'u1',
        otpId: 'otp1',
        purpose: 'password-reset',
      });
      prismaMock.otpCode.findFirst.mockResolvedValueOnce({
        id: 'otp1',
        userId: 'u1',
        status: 'USED',
      });
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'x@x.com',
      });
      prismaMock.$transaction.mockImplementationOnce(async (fn) => {
        const tx = {
          user: { update: jest.fn().mockResolvedValue({}) },
          otpCode: { update: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const res = await service.resetPassword({
        token: 'valid-reset-token',
        password: 'NewPass#123',
      } as any);

      expect(res.success).toBe(true);
      expect(res.message).toBe('Your account password has been changed successfully');
      expect((service as any).sendPasswordResetConfirmationAsync).toHaveBeenCalledWith('x@x.com');
    });

    it('throws UnauthorizedException for invalid token purpose', async () => {
      (jwtMock.verify as jest.Mock).mockReturnValueOnce({
        sub: 'u1',
        otpId: 'otp1',
        purpose: 'wrong-purpose',
      });

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          password: 'NewPass#123',
        } as any),
      ).rejects.toThrow('Invalid token purpose');
    });

    it('throws UnauthorizedException when OTP not found or already used', async () => {
      (jwtMock.verify as jest.Mock).mockReturnValueOnce({
        sub: 'u1',
        otpId: 'otp1',
        purpose: 'password-reset',
      });
      prismaMock.otpCode.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword({
          token: 'token',
          password: 'NewPass#123',
        } as any),
      ).rejects.toThrow('Password reset token has expired or been used');
    });

    it('updates passwordChangedAt timestamp', async () => {
      (jwtMock.verify as jest.Mock).mockReturnValueOnce({
        sub: 'u1',
        otpId: 'otp1',
        purpose: 'password-reset',
      });
      prismaMock.otpCode.findFirst.mockResolvedValueOnce({
        id: 'otp1',
        status: 'USED',
      });
      prismaMock.user.findUnique.mockResolvedValueOnce({ email: 'x@x.com' });

      const updateSpy = jest.fn().mockResolvedValue({});
      prismaMock.$transaction.mockImplementationOnce(async (fn) => {
        const tx = {
          user: { update: updateSpy },
          otpCode: { update: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      await service.resetPassword({
        token: 'token',
        password: 'NewPass#123',
      } as any);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordChangedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('throws UnauthorizedException for TokenExpiredError', async () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      (jwtMock.verify as jest.Mock).mockImplementationOnce(() => {
        throw expiredError;
      });

      await expect(
        service.resetPassword({
          token: 'expired-token',
          password: 'NewPass#123',
        } as any),
      ).rejects.toThrow('Password reset token has expired');
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      (jwtMock.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('JWT error');
      });

      await expect(
        service.resetPassword({
          token: 'token',
          password: 'NewPass#123',
        } as any),
      ).rejects.toThrow('Failed to reset password');
    });

    it('throws InternalServerErrorException when user not found after token verification', async () => {
      (jwtMock.verify as jest.Mock).mockReturnValueOnce({
        sub: 'u1',
        otpId: 'otp1',
        purpose: 'password-reset',
      });
      prismaMock.otpCode.findFirst.mockResolvedValueOnce({
        id: 'otp1',
        status: 'USED',
      });
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // User not found after transaction
      prismaMock.$transaction.mockImplementationOnce(async (fn) => {
        const tx = {
          user: { update: jest.fn().mockResolvedValue({}) },
          otpCode: { update: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      // The error gets wrapped by the catch block
      await expect(
        service.resetPassword({
          token: 'token',
          password: 'NewPass#123',
        } as any),
      ).rejects.toThrow('Failed to reset password');
    });
  });

  describe('changePassword', () => {
    it('changes password successfully when old password matches', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@x.com',
        password: 'hashed-old',
        useGoogle: false,
      });
      prismaMock.user.update.mockResolvedValue({});

      const res = await service.changePassword(
        { oldPassword: 'OldPass#1', newPassword: 'NewPass#2' } as any,
        'u1',
      );

      expect(res.success).toBe(true);
      expect(res.message).toBe('Password changed successfully');
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({ password: expect.any(String) }),
        }),
      );
    });

    it('throws BadRequestException when oldPassword is missing', async () => {
      await expect(
        service.changePassword(
          { oldPassword: '', newPassword: 'NewPass#2' } as any,
          'u1',
        ),
      ).rejects.toThrow('Current password is required');
    });

    it('throws BadRequestException when newPassword is missing', async () => {
      await expect(
        service.changePassword(
          { oldPassword: 'OldPass#1', newPassword: '' } as any,
          'u1',
        ),
      ).rejects.toThrow('New password is required');
    });

    it('throws BadRequestException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(
          { oldPassword: 'OldPass#1', newPassword: 'NewPass#2' } as any,
          'u1',
        ),
      ).rejects.toThrow('User not found');
    });

    it('throws BadRequestException for Google accounts without password', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'google@x.com',
        password: null,
        useGoogle: true,
      });

      await expect(
        service.changePassword(
          { oldPassword: 'OldPass#1', newPassword: 'NewPass#2' } as any,
          'u1',
        ),
      ).rejects.toThrow('Google accounts cannot change password');
    });

    it('throws BadRequestException when old password is incorrect', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@x.com',
        password: 'hashed-old',
        useGoogle: false,
      });

      await expect(
        service.changePassword(
          { oldPassword: 'WrongOldPass#1', newPassword: 'NewPass#2' } as any,
          'u1',
        ),
      ).rejects.toThrow('Old password is incorrect');

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('hashes new password before storing', async () => {
      const bcrypt = require('bcrypt');
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-new');

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@x.com',
        password: 'hashed-old',
        useGoogle: false,
      });
      prismaMock.user.update.mockResolvedValue({});

      await service.changePassword(
        { oldPassword: 'OldPass#1', newPassword: 'NewPass#2' } as any,
        'u1',
      );

      expect(hashSpy).toHaveBeenCalledWith('NewPass#2', 12);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { password: 'hashed-new' },
      });
    });

    it('throws BadRequestException when user has null password but not useGoogle', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@x.com',
        password: null,
        useGoogle: false,
      });

      await expect(
        service.changePassword(
          { oldPassword: 'OldPass#1', newPassword: 'NewPass#2' } as any,
          'u1',
        ),
      ).rejects.toThrow('User does not have a password set');
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.changePassword(
          { oldPassword: 'OldPass#1', newPassword: 'NewPass#2' } as any,
          'u1',
        ),
      ).rejects.toThrow('Failed to change password');
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordChangedAt: null,
      });
      prismaMock.refreshToken.findFirst.mockResolvedValue({
        id: 'rt1',
        tokenHash: 'hash123',
        userId: 'u1',
        jti: 'session-jti',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      (jwtRefreshMock.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        profileId: 'profile-id',
        jti: 'session-jti',
        iat: Math.floor(Date.now() / 1000),
      });
    });

    it('returns new tokens for valid refresh token', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        const tx = {
          refreshToken: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      jest.spyOn(service as any, 'cleanupOldTokens').mockResolvedValue(undefined);

      const res = await service.refreshToken(
        { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
        'valid-refresh-token',
      );

      expect(res.success).toBe(true);
      expect(res.data.accessToken).toBeDefined();
      expect(res.data.refreshToken).toBeDefined();
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('uses transaction to revoke and create tokens atomically', async () => {
      // Restore real implementation for this test
      jest.spyOn(service as any, 'generateTokenPair').mockRestore();
      jest.spyOn(service as any, 'cleanupOldTokens').mockResolvedValue(undefined);

      const txMock = {
        refreshToken: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          create: jest.fn().mockResolvedValue({}),
        },
      };

      let capturedTx: any;
      prismaMock.$transaction.mockImplementation(async (fn) => {
        capturedTx = txMock;
        return fn(txMock);
      });

      // Mock JWT sign methods
      (jwtMock.sign as jest.Mock).mockReturnValue('new-access-token');
      (jwtRefreshMock.sign as jest.Mock).mockReturnValue('new-refresh-token');

      await service.refreshToken(
        { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
        'valid-refresh-token',
      );

      expect(capturedTx.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { revoked: true },
        }),
      );
      expect(capturedTx.refreshToken.create).toHaveBeenCalled();

      // Restore mock
      jest
        .spyOn(service as any, 'generateTokenPair')
        .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
    });

    it('calls cleanupOldTokens in background after successful refresh', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        const tx = {
          refreshToken: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      const cleanupSpy = jest
        .spyOn(service as any, 'cleanupOldTokens')
        .mockResolvedValue(undefined);

      await service.refreshToken(
        { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
        'valid-refresh-token',
      );

      expect(cleanupSpy).toHaveBeenCalledWith('u1');
    });

    it('throws UnauthorizedException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken(
          { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
          'refresh',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when refresh token not found in database', async () => {
      prismaMock.refreshToken.findFirst.mockResolvedValue(null);

      await expect(
        service.refreshToken(
          { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
          'invalid-token',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when JTI mismatch detected', async () => {
      prismaMock.refreshToken.findFirst.mockResolvedValue({
        id: 'rt1',
        tokenHash: 'hash123',
        userId: 'u1',
        jti: 'different-jti',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(
        service.refreshToken(
          { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
          'refresh',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password changed after token issued', async () => {
      const futureDate = new Date(Date.now() + 100000);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordChangedAt: futureDate,
      });
      (jwtRefreshMock.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        profileId: 'profile-id',
        jti: 'session-jti',
        iat: Math.floor((Date.now() - 200000) / 1000),
      });

      await expect(
        service.refreshToken(
          { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
          'refresh',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        service.refreshToken(
          { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
          'refresh',
        ),
      ).rejects.toThrow('Failed to refresh token');
    });
  });

  describe('google flows', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'cleanupOldTokens').mockResolvedValue(undefined);
      (service as any).googleClient.verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: 'google@x.com',
          name: 'Google User',
          picture: 'https://example.com/avatar.jpg',
          sub: 'google-sub-id',
        }),
      });
    });

    describe('googleSignup', () => {
      it('creates new PLAYER with Google auth and returns tokens', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.$transaction.mockImplementation(async (fn) =>
          fn({
            user: {
              create: jest.fn().mockResolvedValue({
                id: 'u1',
                email: 'google@x.com',
                userType: 'PLAYER',
              }),
            },
            player: {
              create: jest.fn().mockResolvedValue({
                id: 'p1',
                avatar: 'https://example.com/avatar.jpg',
                onboardingSteps: [],
              }),
            },
            company: { create: jest.fn() },
            club: { create: jest.fn(), findFirst: jest.fn() },
            admin: { create: jest.fn() },
            affiliate: { create: jest.fn() },
          }),
        );

        const res = await service.googleSignup({
          authToken: 'google-id-token',
          refCode: 'REF1',
          userType: 'PLAYER',
        } as any);

        expect(res.success).toBe(true);
        expect(res.message).toBe('User registered successfully with Google.');
        expect(res.data.accessToken).toBe('access');
        expect(res.data.refreshToken).toBe('refresh');
        expect(res.data.user).toEqual(mockProfile);
      });

      it('creates COMPANY user with Google auth', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.$transaction.mockImplementation(async (fn) =>
          fn({
            user: {
              create: jest.fn().mockResolvedValue({
                id: 'u2',
                email: 'company@x.com',
                userType: 'COMPANY',
              }),
            },
            company: {
              create: jest.fn().mockResolvedValue({
                id: 'c1',
                avatar: 'https://example.com/avatar.jpg',
                onboardingSteps: [],
              }),
            },
            player: { create: jest.fn() },
            club: { create: jest.fn(), findFirst: jest.fn() },
            admin: { create: jest.fn() },
            affiliate: { create: jest.fn() },
          }),
        );

        const res = await service.googleSignup({
          authToken: 'google-id-token',
          refCode: 'REF1',
          userType: 'COMPANY',
        } as any);

        expect(res.success).toBe(true);
        expect(res.data.accessToken).toBeDefined();
      });

      it('creates CLUB user with Google auth by updating existing pending user', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.$transaction.mockImplementation(async (fn) =>
          fn({
            user: {
              update: jest.fn().mockResolvedValue({
                id: 'u3',
                email: 'club@x.com',
                userType: 'CLUB',
                status: 'ACTIVE',
                useGoogle: true,
              }),
            },
            club: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'club1',
                refCode: 'REF1',
                userId: 'u3',
                onboardingSteps: [],
              }),
              update: jest.fn().mockResolvedValue({}),
            },
            player: { create: jest.fn() },
            company: { create: jest.fn() },
            admin: { create: jest.fn() },
            affiliate: { create: jest.fn() },
          }),
        );

        const res = await service.googleSignup({
          authToken: 'google-id-token',
          userType: 'CLUB',
        } as any);

        expect(res.success).toBe(true);
        expect(res.data.accessToken).toBeDefined();
      });

      it('throws error when CLUB profile not found during Google signup', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.$transaction.mockImplementation(async (fn) =>
          fn({
            user: {
              update: jest.fn().mockResolvedValue({
                id: 'u3',
                email: 'club@x.com',
                userType: 'CLUB',
              }),
            },
            club: {
              findUnique: jest.fn().mockResolvedValue(null),
            },
            player: { create: jest.fn() },
            company: { create: jest.fn() },
            admin: { create: jest.fn() },
            affiliate: { create: jest.fn() },
          }),
        );

        await expect(
          service.googleSignup({
            authToken: 'google-id-token',
            userType: 'CLUB',
          } as any),
        ).rejects.toThrow('Club profile not found for invited user');
      });

      it('creates SUPPORTER user with Google auth', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.$transaction.mockImplementation(async (fn) =>
          fn({
            user: {
              create: jest.fn().mockResolvedValue({
                id: 'u4',
                email: 'supporter@x.com',
                userType: 'SUPPORTER',
              }),
            },
            player: {
              create: jest.fn().mockResolvedValue({
                id: 's1',
                avatar: 'https://example.com/avatar.jpg',
                onboardingSteps: [],
              }),
            },
            company: { create: jest.fn() },
            club: { create: jest.fn() },
            admin: { create: jest.fn() },
            affiliate: { create: jest.fn() },
          }),
        );

        const res = await service.googleSignup({
          authToken: 'google-id-token',
          refCode: 'REF1',
          userType: 'SUPPORTER',
        } as any);

        expect(res.success).toBe(true);
        expect(res.data.accessToken).toBeDefined();
      });

      it('calls cleanupOldTokens after token generation', async () => {
        const cleanupSpy = jest
          .spyOn(service as any, 'cleanupOldTokens')
          .mockResolvedValue(undefined);

        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.$transaction.mockImplementation(async (fn) =>
          fn({
            user: {
              create: jest.fn().mockResolvedValue({
                id: 'u1',
                email: 'google@x.com',
                userType: 'PLAYER',
              }),
            },
            player: { create: jest.fn().mockResolvedValue({ id: 'p1' }) },
            company: { create: jest.fn() },
            club: { create: jest.fn() },
            admin: { create: jest.fn() },
            affiliate: { create: jest.fn() },
          }),
        );

        await service.googleSignup({
          authToken: 'google-id-token',
          refCode: 'REF1',
          userType: 'PLAYER',
        } as any);

        expect(cleanupSpy).toHaveBeenCalledWith('u1');
      });

      it('throws UnauthorizedException when Google token is invalid', async () => {
        (service as any).googleClient.verifyIdToken = jest
          .fn()
          .mockResolvedValue({ getPayload: () => null });

        await expect(
          service.googleSignup({
            authToken: 'invalid-token',
            refCode: 'REF1',
            userType: 'PLAYER',
          } as any),
        ).rejects.toThrow('Invalid Google token');
      });

      it('throws UnauthorizedException when email missing from Google token', async () => {
        (service as any).googleClient.verifyIdToken = jest.fn().mockResolvedValue({
          getPayload: () => ({ name: 'Test', sub: 'sub' }),
        });

        await expect(
          service.googleSignup({
            authToken: 'token',
            refCode: 'REF1',
            userType: 'PLAYER',
          } as any),
        ).rejects.toThrow('Invalid Google token: email not provided');
      });

      it('throws UnauthorizedException when name missing from Google token', async () => {
        (service as any).googleClient.verifyIdToken = jest.fn().mockResolvedValue({
          getPayload: () => ({ email: 'test@x.com', sub: 'sub' }),
        });

        await expect(
          service.googleSignup({
            authToken: 'token',
            refCode: 'REF1',
            userType: 'PLAYER',
          } as any),
        ).rejects.toThrow('Invalid Google token: name not provided');
      });

      it('wraps unexpected errors as InternalServerErrorException', async () => {
        prismaMock.$transaction.mockRejectedValue(new Error('DB error'));

        await expect(
          service.googleSignup({
            authToken: 'google-id-token',
            refCode: 'REF1',
            userType: 'PLAYER',
          } as any),
        ).rejects.toThrow('Failed to create account with Google');
      });
    });

    describe('googleLogin', () => {
      it('returns tokens for existing Google user', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          id: 'u1',
          email: 'google@x.com',
          userType: 'PLAYER',
          status: 'ACTIVE',
          useGoogle: true,
        });

        const res = await service.googleLogin({ authToken: 'google-token' } as any);

        expect(res.success).toBe(true);
        expect(res.message).toBe('Google login successful');
        expect(res.data.accessToken).toBe('access');
        expect(res.data.refreshToken).toBe('refresh');
        expect(res.data.user).toEqual(mockProfile);
      });

      it('calls cleanupOldTokens after successful login', async () => {
        const cleanupSpy = jest
          .spyOn(service as any, 'cleanupOldTokens')
          .mockResolvedValue(undefined);

        prismaMock.user.findUnique.mockResolvedValue({
          id: 'u1',
          email: 'google@x.com',
          userType: 'PLAYER',
        });

        await service.googleLogin({ authToken: 'google-token' } as any);

        expect(cleanupSpy).toHaveBeenCalledWith('u1');
      });

      it('creates login notification after successful login', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          id: 'u1',
          email: 'google@x.com',
          userType: 'PLAYER',
        });

        await service.googleLogin({ authToken: 'google-token' } as any);

        expect((service as any).createLoginNotificationAsync).toHaveBeenCalledWith('u1');
      });

      it('throws UnauthorizedException when user not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        await expect(
          service.googleLogin({ authToken: 'google-token' } as any),
        ).rejects.toThrow('Account not found');
      });

      it('throws UnauthorizedException for invalid Google token', async () => {
        (service as any).googleClient.verifyIdToken = jest
          .fn()
          .mockResolvedValue({ getPayload: () => null });

        await expect(
          service.googleLogin({ authToken: 'invalid-token' } as any),
        ).rejects.toThrow('Invalid Google token');
      });

      it('wraps unexpected errors as InternalServerErrorException', async () => {
        prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

        await expect(
          service.googleLogin({ authToken: 'google-token' } as any),
        ).rejects.toThrow('Google login failed');
      });
    });
  });

  describe('verifyOtp', () => {
    it('should return a reset token for PASSWORD_RESET otp type', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        id: 'otp1',
        email: 'x@x.com',
        user: { id: 'u1' },
      });
      (jwtMock.sign as jest.Mock).mockReturnValueOnce('reset-token');

      const result = await service.verifyOtp({
        email: 'x@x.com',
        otp: '123456',
        type: OtpType.PASSWORD_RESET,
      });

      expect(result.success).toBe(true);
      expect(result.data.resetToken).toBe('reset-token');
      expect(jwtMock.sign).toHaveBeenCalledWith(
        {
          sub: 'u1',
          otpId: 'otp1',
          purpose: 'password-reset',
        },
        { expiresIn: '15m' },
      );
    });

    it('should return user and affiliate data for other otp types', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockResolvedValueOnce({
        id: 'otp2',
        email: 'a@a.com',
        user: { id: 'u2' },
        affiliateId: 'aff1',
      });

      const result = await service.verifyOtp({
        email: 'a@a.com',
        otp: '654321',
        type: OtpType.EMAIL_VERIFICATION,
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('a@a.com');
      expect(result.data.userId).toBe('u2');
      expect(result.data.affiliateId).toBe('aff1');
    });

    it('should throw UnauthorizedException for invalid otp', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockRejectedValueOnce(
        new UnauthorizedException('Invalid OTP'),
      );

      await expect(
        service.verifyOtp({
          email: 'a@a.com',
          otp: '000000',
          type: OtpType.EMAIL_VERIFICATION,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('wraps unexpected errors as InternalServerErrorException', async () => {
      (otpUtilsMock.verifyOtp as jest.Mock).mockRejectedValueOnce(
        new Error('DB error'),
      );

      await expect(
        service.verifyOtp({
          email: 'a@a.com',
          otp: '123456',
          type: OtpType.EMAIL_VERIFICATION,
        }),
      ).rejects.toThrow('An unexpected error occurred');
    });
  });

  describe('cleanupOldTokens', () => {
    it('removes expired tokens for a user', async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValueOnce({ count: 3 });
      prismaMock.refreshToken.findMany.mockResolvedValue([
        { id: 'rt1', createdAt: new Date() },
        { id: 'rt2', createdAt: new Date() },
      ]);

      await (service as any).cleanupOldTokens('u1');

      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'u1',
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });

    it('removes excess tokens when user has more than 5 active tokens', async () => {
      const mockTokens = Array.from({ length: 7 }, (_, i) => ({
        id: `rt${i + 1}`,
        createdAt: new Date(Date.now() - i * 1000),
        revoked: false,
      }));

      prismaMock.refreshToken.deleteMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 2 });
      prismaMock.refreshToken.findMany.mockResolvedValue(mockTokens);

      await (service as any).cleanupOldTokens('u1');

      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledTimes(2);
      expect(prismaMock.refreshToken.deleteMany).toHaveBeenNthCalledWith(2, {
        where: { id: { in: ['rt6', 'rt7'] } },
      });
    });

    it('does not throw error if cleanup fails', async () => {
      prismaMock.refreshToken.deleteMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        (service as any).cleanupOldTokens('u1'),
      ).resolves.not.toThrow();
    });

    it('keeps exactly 5 most recent tokens', async () => {
      const mockTokens = [
        { id: 'rt1', createdAt: new Date('2024-01-06'), revoked: false },
        { id: 'rt2', createdAt: new Date('2024-01-05'), revoked: false },
        { id: 'rt3', createdAt: new Date('2024-01-04'), revoked: false },
        { id: 'rt4', createdAt: new Date('2024-01-03'), revoked: false },
        { id: 'rt5', createdAt: new Date('2024-01-02'), revoked: false },
        { id: 'rt6', createdAt: new Date('2024-01-01'), revoked: false },
      ];

      prismaMock.refreshToken.deleteMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 1 });
      prismaMock.refreshToken.findMany.mockResolvedValue(mockTokens);

      await (service as any).cleanupOldTokens('u1');

      expect(prismaMock.refreshToken.deleteMany).toHaveBeenNthCalledWith(2, {
        where: { id: { in: ['rt6'] } },
      });
    });
  });

  describe('logout', () => {
    it('removes all refresh tokens when jti not provided', async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const res = await service.logout('u1');

      expect(res.success).toBe(true);
      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
    });

    it('removes only specific session tokens when jti provided', async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.logout('u1', 'session-jti');

      expect(res.success).toBe(true);
      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', jti: 'session-jti' },
      });
    });

    it('throws InternalServerErrorException when logout fails', async () => {
      prismaMock.refreshToken.deleteMany.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.logout('u1')).rejects.toThrow('Logout failed');
    });
  });

  describe('race condition scenarios', () => {
    it('prevents duplicate token creation from concurrent refreshToken calls', async () => {
      let transactionCallCount = 0;
      prismaMock.$transaction.mockImplementation(async (fn) => {
        transactionCallCount++;
        const tx = {
          refreshToken: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordChangedAt: null,
      });
      prismaMock.refreshToken.findFirst.mockResolvedValue({
        id: 'rt1',
        tokenHash: 'hash123',
        userId: 'u1',
        jti: 'session-jti',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      (jwtRefreshMock.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        profileId: 'profile-id',
        jti: 'session-jti',
        iat: Math.floor(Date.now() / 1000),
      });
      jest.spyOn(service as any, 'cleanupOldTokens').mockResolvedValue(undefined);

      // Simulate two concurrent refresh requests
      const promise1 = service.refreshToken(
        { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
        'valid-refresh-token',
      );
      const promise2 = service.refreshToken(
        { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
        'valid-refresh-token',
      );

      await Promise.all([promise1, promise2]);

      // Both should use transactions
      expect(transactionCallCount).toBe(2);
    });

    it('transaction rollback prevents partial token state', async () => {
      // Restore real implementation for this test
      jest.spyOn(service as any, 'generateTokenPair').mockRestore();
      const cleanupSpy = jest
        .spyOn(service as any, 'cleanupOldTokens')
        .mockResolvedValue(undefined);

      // Mock JWT sign methods
      (jwtMock.sign as jest.Mock).mockReturnValue('new-access-token');
      (jwtRefreshMock.sign as jest.Mock).mockReturnValue('new-refresh-token');

      // Make transaction fail during create
      prismaMock.$transaction.mockImplementation(async (fn) => {
        const tx = {
          refreshToken: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest
              .fn()
              .mockRejectedValue(new Error('Database constraint violation')),
          },
        };
        return fn(tx);
      });

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordChangedAt: null,
      });
      prismaMock.refreshToken.findFirst.mockResolvedValue({
        id: 'rt1',
        tokenHash: 'hash123',
        userId: 'u1',
        jti: 'session-jti',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      (jwtRefreshMock.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        profileId: 'profile-id',
        jti: 'session-jti',
        iat: Math.floor(Date.now() / 1000),
      });

      await expect(
        service.refreshToken(
          { userId: 'u1', profileId: 'profile-id', jti: 'session-jti' } as any,
          'valid-refresh-token',
        ),
      ).rejects.toThrow();

      // Cleanup should not be called if transaction fails
      expect(cleanupSpy).not.toHaveBeenCalled();

      // Restore mock
      jest
        .spyOn(service as any, 'generateTokenPair')
        .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
    });
  });
});