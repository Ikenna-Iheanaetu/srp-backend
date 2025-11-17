import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AffiliateStatus,
  AffiliateType,
  OtpStatus,
  OtpType,
  UserStatus,
  UserType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { CodeGeneratorService, OtpUtilsService } from 'src/utils';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { GOOGLE_OAUTH_CLIENT, REFRESH_JWT_SERVICE } from './auth.providers';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { GoogleSignupDto } from './dto/google-signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/sign-up.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';

import { BCRYPT_SALT_ROUNDS } from 'src/common/constants/salt-rounds';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGen: CodeGeneratorService,
    private readonly otpUtils: OtpUtilsService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    @Inject(REFRESH_JWT_SERVICE) private readonly jwtRefresh: JwtService,
    @Inject(GOOGLE_OAUTH_CLIENT) private readonly googleClient: OAuth2Client,
  ) {}

  async signup(signupDto: SignupDto) {
    const startTime = Date.now();
    const { name, userType, email, password, refCode } = signupDto;

    this.logger.log(`Signup attempt for email: ${email}`);

    try {
      const validationResult = await this.validateSignupRequest(signupDto);

      const result = await this.prisma.$transaction(async (tx) => {
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        let user;
        let profile;

        if (userType === UserType.CLUB) {
          // Update the existing pending club user
          user = await tx.user.update({
            where: { email },
            data: {
              name,
              password: hashedPassword,
              status: UserStatus.ACTIVE,
            },
          });

          // Retrieve the existing club profile that was created during invitation
          profile = await tx.club.findUnique({
            where: { userId: user.id },
            select: {
              id: true,
              refCode: true,
              userId: true,
              onboardingSteps: true,
            },
          });

          if (!profile) {
            throw new InternalServerErrorException({
              message: 'Club profile not found for invited user',
              errors: [{ field: 'profile', message: 'Club profile missing' }],
            });
          }
        } else {
          // Create new user for non-club types
          user = await tx.user.create({
            data: {
              email,
              name,
              userType,
              password: hashedPassword,
              status: UserStatus.PENDING,
            },
          });

          profile = await this.createProfile(user.id, userType, tx);
          if (!profile) {
            throw new InternalServerErrorException({
              message: 'Failed to create user profile',
              errors: [
                { field: 'profile', message: 'Profile creation failed' },
              ],
            });
          }
        }

        const generatedOtp = await this.otpUtils.generateAndSaveOtp(
          email,
          OtpType.EMAIL_VERIFICATION,
          user.id,
        );

        // Handle refCode for non-club users (clubs don't affiliate with themselves)
        if (refCode && userType !== UserType.CLUB) {
          await this.handleRefCode(
            refCode,
            userType,
            email,
            user,
            validationResult?.clubData,
            tx,
          );
        }

        return { user, profile, generatedOtp };
      });

      this.sendVerificationEmailAsync(email, result.generatedOtp);
      console.log(`DEBUG:::: `, result.profile);

      const { accessToken, refreshToken } = await this.generateTokenPair(
        result.profile.id,
        result.user.id,
      );

      // Cleanup old tokens in background (non-blocking)
      this.cleanupOldTokens(result.user.id).catch((err) => {
        this.logger.error(
          `Background cleanup failed for user ${result.user.id}:`,
          err,
        );
      });

      const profileData = await this.getUserProfileData(
        result.user.userType,
        result.user.id,
      );

      const duration = Date.now() - startTime;
      this.logger.log(`Signup completed for ${email} in ${duration}ms`);

      return {
        success: true,
        message: 'User registered successfully. Verification email sent.',
        data: {
          user: profileData,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      this.logger.error(`Signup failed for ${email}:`, error);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to create account. Please try again later.',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred during signup',
          },
        ],
      });
    }
  }

  async login(loginDto: LoginDto) {
    const startTime = Date.now();
    const { email, password } = loginDto;

    this.logger.log(`Login attempt for email: ${email}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          userType: true,
          status: true,
          useGoogle: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException({
          message: 'Account not found',
          errors: [
            { field: 'email', message: 'No account found with this email' },
          ],
        });
      }

      if (user.useGoogle && !user.password) {
        throw new UnauthorizedException({
          message: 'Sign in with Google',
          errors: [
            { field: 'email', message: 'This account uses Google Sign-In' },
          ],
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password!);
      if (!passwordMatch) {
        throw new UnauthorizedException({
          message: 'Invalid password',
          errors: [{ field: 'password', message: 'Incorrect password' }],
        });
      }

      const profileData = await this.getUserProfileData(user.userType, user.id);

      const { accessToken, refreshToken } = await this.generateTokenPair(
        profileData.id,
        user.id,
      );

      // Cleanup old tokens in background (non-blocking)
      this.cleanupOldTokens(user.id).catch((err) => {
        this.logger.error(
          `Background cleanup failed for user ${user.id}:`,
          err,
        );
      });

      this.createLoginNotificationAsync(user.id);

      const duration = Date.now() - startTime;
      this.logger.log(`Login completed for ${email} in ${duration}ms`);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: profileData,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed for ${email}:`, error);

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Login failed. Please try again later.',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred during login',
          },
        ],
      });
    }
  }

  async googleSignup(googleSignupDto: GoogleSignupDto) {
    const startTime = Date.now();
    const { userType, authToken, refCode } = googleSignupDto;

    this.logger.log(`Google signup attempt for userType: ${userType}`);

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: authToken,
        audience: this.config.get('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException({
          message: 'Invalid Google token',
          errors: [
            {
              field: 'authToken',
              message: 'Token verification failed',
              code: 'INVALID_TOKEN',
            },
          ],
        });
      }

      const { name, email, picture } = payload as {
        name?: string;
        email?: string;
        picture?: string;
      };

      if (!email) {
        throw new UnauthorizedException({
          message: 'Invalid Google token: email not provided',
          errors: [
            {
              field: 'authToken',
              message: 'Email claim is missing from Google token',
              code: 'MISSING_EMAIL',
            },
          ],
        });
      }

      if (!name) {
        throw new UnauthorizedException({
          message: 'Invalid Google token: name not provided',
          errors: [
            {
              field: 'authToken',
              message: 'Name claim is missing from Google token',
              code: 'MISSING_NAME',
            },
          ],
        });
      }

      const safePicture =
        typeof picture === 'string' && picture.trim() ? picture : undefined;

      // Validate the Google signup request (includes refCode validation)
      const validationResult = await this.validateSignupRequest({
        userType: userType as UserType,
        email,
        refCode,
      } as SignupDto);

      const result = await this.prisma.$transaction(async (tx) => {
        let user;
        let profile;

        if (userType === UserType.CLUB) {
          // Update existing pending club user
          user = await tx.user.update({
            where: { email },
            data: {
              name,
              status: UserStatus.ACTIVE,
              useGoogle: true,
            },
          });

          // Retrieve existing club profile
          profile = await tx.club.findUnique({
            where: { userId: user.id },
            select: {
              id: true,
              refCode: true,
              userId: true,
              onboardingSteps: true,
            },
          });

          if (!profile) {
            throw new InternalServerErrorException({
              message: 'Club profile not found for invited user',
              errors: [{ field: 'profile', message: 'Club profile missing' }],
            });
          }

          // Update club avatar if picture provided
          if (safePicture) {
            await tx.club.update({
              where: { id: profile.id },
              data: { avatar: safePicture },
            });
          }
        } else {
          // Create new user for non-club types
          user = await tx.user.create({
            data: {
              email,
              name,
              userType,
              password: null,
              status: UserStatus.ACTIVE,
              useGoogle: true,
            },
          });

          profile = await this.createGoogleProfile(
            user.id,
            email,
            userType as UserType,
            safePicture ?? '',
            tx,
          );

          if (!profile) {
            throw new InternalServerErrorException({
              message: 'Failed to create user profile',
              errors: [
                { field: 'profile', message: 'Profile creation failed' },
              ],
            });
          }
        }

        // Handle refCode for non-club users (clubs don't affiliate with themselves)
        if (refCode && userType !== UserType.CLUB) {
          await this.handleRefCode(
            refCode,
            userType as UserType,
            email,
            user,
            validationResult?.clubData,
            tx,
          );
        }

        return { user, profile };
      });

      const { accessToken, refreshToken } = await this.generateTokenPair(
        result.profile.id,
        result.user.id,
      );

      // Cleanup old tokens in background (non-blocking)
      this.cleanupOldTokens(result.user.id).catch((err) => {
        this.logger.error(
          `Background cleanup failed for user ${result.user.id}:`,
          err,
        );
      });

      const profileData = await this.getUserProfileData(
        result.user.userType,
        result.user.id,
      );

      const duration = Date.now() - startTime;
      this.logger.log(`Google signup completed for ${email} in ${duration}ms`);

      return {
        success: true,
        message: 'User registered successfully with Google.',
        data: {
          user: profileData,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      this.logger.error(`Google signup failed:`, error);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message:
          'Failed to create account with Google. Please try again later.',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred during Google signup',
          },
        ],
      });
    }
  }

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    const startTime = Date.now();
    const { authToken } = googleLoginDto;

    this.logger.log(`Google login attempt`);

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: authToken,
        audience: this.config.get('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException({
          message: 'Invalid Google token',
          errors: [
            {
              field: 'authToken',
              message: 'Token verification failed',
              code: 'INVALID_TOKEN',
            },
          ],
        });
      }

      const { email } = payload;

      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          userType: true,
          status: true,
          useGoogle: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException({
          message: 'Account not found',
          errors: [
            { field: 'email', message: 'No account found with this email' },
          ],
        });
      }

      const profileData = await this.getUserProfileData(user.userType, user.id);

      const { accessToken, refreshToken } = await this.generateTokenPair(
        profileData.id,
        user.id,
      );

      // Cleanup old tokens in background (non-blocking)
      this.cleanupOldTokens(user.id).catch((err) => {
        this.logger.error(
          `Background cleanup failed for user ${user.id}:`,
          err,
        );
      });

      this.createLoginNotificationAsync(user.id);

      const duration = Date.now() - startTime;
      this.logger.log(`Google login completed for ${email} in ${duration}ms`);

      return {
        success: true,
        message: 'Google login successful',
        data: {
          user: profileData,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      this.logger.error(`Google login failed:`, error);

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Google login failed. Please try again later.',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred during Google login',
          },
        ],
      });
    }
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;

    this.logger.log(`OTP resend request for email: ${email}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, status: true },
      });

      if (!user) {
        throw new BadRequestException({
          message: 'This email does not exist',
          errors: [
            {
              field: 'email',
              message: 'No account found with this email',
              code: 'EMAIL_NOT_FOUND',
            },
          ],
        });
      }

      if (user.status === UserStatus.ACTIVE) {
        throw new BadRequestException({
          message: 'Account is already verified',
          errors: [
            {
              field: 'email',
              message: 'This account is already active',
              code: 'ALREADY_VERIFIED',
            },
          ],
        });
      }

      const otp = await this.otpUtils.generateAndSaveOtp(
        email,
        OtpType.EMAIL_VERIFICATION,
        user.id,
      );

      this.sendVerificationEmailAsync(email, otp);

      this.logger.log(`OTP resent successfully to ${email}`);

      return {
        success: true,
        message: 'OTP resent successfully',
      };
    } catch (error) {
      this.logger.error(`OTP resend failed for ${email}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to resend OTP. Please try again later.',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred while resending OTP',
          },
        ],
      });
    }
  }

  async verifyAccount(verifyAccountDto: VerifyAccountDto) {
    const startTime = Date.now();
    const { otp, email } = verifyAccountDto;

    this.logger.log(`Account verification attempt for email: ${email}`);

    try {
      const verifiedOtp = await this.performOtpVerification(
        email,
        otp,
        OtpType.EMAIL_VERIFICATION,
      );

      if (!verifiedOtp.user) {
        throw new UnauthorizedException({
          message: 'User not found',
          errors: [
            {
              field: 'otp',
              message: 'No user associated with this OTP',
              code: 'USER_NOT_FOUND',
            },
          ],
        });
      }

      const user = verifiedOtp.user;

      if (user.status === UserStatus.ACTIVE) {
        const profileData = await this.getUserProfileData(
          user.userType,
          user.id,
        );
        const { accessToken, refreshToken } = await this.generateTokenPair(
          profileData.id,
          user.id,
        );

        // Cleanup old tokens in background (non-blocking)
        this.cleanupOldTokens(user.id).catch((err) => {
          this.logger.error(
            `Background cleanup failed for user ${user.id}:`,
            err,
          );
        });

        return {
          success: true,
          message: 'Account already verified',
          data: {
            user: profileData,
            accessToken,
            refreshToken,
          },
        };
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { status: UserStatus.ACTIVE },
          select: {
            id: true,
            email: true,
            userType: true,
            status: true,
          },
        });

        if (
          updatedUser.userType === UserType.PLAYER ||
          updatedUser.userType === UserType.SUPPORTER
        ) {
          const affiliate = await tx.affiliate.findFirst({
            where: {
              userId: updatedUser.id,
              type:
                updatedUser.userType === UserType.PLAYER
                  ? AffiliateType.PLAYER
                  : AffiliateType.SUPPORTER,
              status: UserStatus.ACTIVE,
            },
            select: { id: true, clubId: true },
          });

          if (affiliate?.clubId && updatedUser.userType === UserType.PLAYER) {
            await tx.player.updateMany({
              where: { userId: updatedUser.id },
              data: { clubId: affiliate.clubId },
            });
          }
        }

        return updatedUser;
      });

      const profileData = await this.getUserProfileData(
        result.userType,
        result.id,
      );

      const { accessToken, refreshToken } = await this.generateTokenPair(
        profileData.id,
        result.id,
      );

      // Cleanup old tokens in background (non-blocking)
      this.cleanupOldTokens(result.id).catch((err) => {
        this.logger.error(
          `Background cleanup failed for user ${result.id}:`,
          err,
        );
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Account verified successfully for ${result.email} in ${duration}ms`,
      );

      return {
        success: true,
        message: 'Account verified successfully',
        data: {
          user: profileData,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Account verification failed for ${email} after ${duration}ms:`,
        error,
      );

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to verify account. Please try again later.',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred during account verification',
          },
        ],
      });
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, otp, type } = dto;
    this.logger.log(`OTP verification attempt for ${email}, type: ${type}`);

    try {
      const verifiedOtp = await this.performOtpVerification(email, otp, type);

      if (!verifiedOtp.user) {
        throw new UnauthorizedException({
          message: 'Invalid OTP or user association',
        });
      }

      const response = this.generateOtpVerificationResponse(verifiedOtp, type);

      this.logger.log(`OTP verified for ${email}, type: ${type}`);
      return response;
    } catch (error) {
      this.logger.error(`OTP verification failed for ${email}:`, error);
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException({
          message: 'Invalid or expired OTP',
          errors: [{ field: 'otp', message: error.message }],
        });
      }
      throw new InternalServerErrorException({
        message: 'An unexpected error occurred during OTP verification.',
      });
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    this.logger.log(`Password reset request for email: ${email}`);

    try {
      if (!email) {
        throw new UnauthorizedException({
          message: 'Email is required',
          errors: [
            {
              field: 'email',
              message: 'Email address is required',
              code: 'REQUIRED_FIELD',
            },
          ],
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, useGoogle: true },
      });

      if (!user) {
        throw new UnauthorizedException({
          message: 'User not found',
          errors: [
            {
              field: 'email',
              message: 'No account found with this email address',
              code: 'USER_NOT_FOUND',
            },
          ],
        });
      }

      if (user.useGoogle) {
        throw new BadRequestException({
          message: 'Google account cannot reset password',
          errors: [
            {
              field: 'email',
              message:
                'This account uses Google Sign-In and cannot reset password',
              code: 'GOOGLE_ACCOUNT',
            },
          ],
        });
      }

      const otp = await this.otpUtils.generateAndSaveOtp(
        email,
        OtpType.PASSWORD_RESET,
        user.id,
      );

      this.sendPasswordResetEmailAsync(email, otp);

      this.logger.log(`Password reset OTP sent to ${email}`);

      return {
        success: true,
        message: 'Your account password reset otp has been sent to your email',
      };
    } catch (error) {
      this.logger.error(`Password reset failed for ${email}:`, error);

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message:
          'Failed to process password reset request. Please try again later.',
        errors: [
          {
            field: 'server',
            message:
              'An unexpected error occurred during password reset request',
          },
        ],
      });
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    this.logger.log(`Password reset attempt with token`);

    try {
      const payload = this.jwtService.verify(token);

      if (payload.purpose !== 'password-reset') {
        throw new UnauthorizedException({
          message: 'Invalid token purpose',
        });
      }

      const otpRecord = await this.prisma.otpCode.findFirst({
        where: {
          id: payload.otpId,
          userId: payload.sub,
          status: OtpStatus.USED,
        },
      });

      if (!otpRecord) {
        throw new UnauthorizedException({
          message: 'Password reset token has expired or been used',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: payload.sub },
          data: {
            password: hashedPassword,
            passwordChangedAt: new Date(),
          },
        });

        await tx.otpCode.update({
          where: { id: payload.otpId },
          data: { status: OtpStatus.REVOKED },
        });
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new InternalServerErrorException({
          message: 'User not found after successful token verification.',
        });
      }

      this.sendPasswordResetConfirmationAsync(user.email);

      this.logger.log(`Password reset successful for user ${payload.sub}`);

      return {
        success: true,
        message: 'Your account password has been changed successfully',
      };
    } catch (error) {
      this.logger.error(`Password reset failed:`, error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Password reset token has expired',
        });
      }

      throw new InternalServerErrorException({
        message: 'Failed to reset password. Please try again later.',
      });
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto, userId: string) {
    const { oldPassword, newPassword } = changePasswordDto;

    this.logger.log(`Password change request for user: ${userId}`);

    try {
      if (!oldPassword) {
        throw new BadRequestException({
          message: 'Current password is required',
          errors: [
            {
              field: 'oldPassword',
              message: 'Current password is required',
              code: 'REQUIRED_FIELD',
            },
          ],
        });
      }

      if (!newPassword) {
        throw new BadRequestException({
          message: 'New password is required',
          errors: [
            {
              field: 'newPassword',
              message: 'New password is required',
              code: 'REQUIRED_FIELD',
            },
          ],
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          password: true,
          useGoogle: true,
        },
      });

      if (!user) {
        throw new BadRequestException({
          message: 'User not found',
          errors: [
            {
              field: 'user',
              message: 'User account not found',
              code: 'USER_NOT_FOUND',
            },
          ],
        });
      }

      if (user.useGoogle && !user.password) {
        throw new BadRequestException({
          message: 'Google accounts cannot change password',
          errors: [
            {
              field: 'account',
              message: 'This Google account does not have a password to change',
              code: 'GOOGLE_ACCOUNT',
            },
          ],
        });
      }

      if (user.password === null) {
        throw new BadRequestException({
          message: 'User does not have a password set',
          errors: [
            {
              field: 'oldPassword',
              message: 'No password is set for this user',
              code: 'NO_PASSWORD_SET',
            },
          ],
        });
      }

      const isMatch = await bcrypt.compare(
        oldPassword,
        user.password as string,
      );
      if (!isMatch) {
        throw new BadRequestException({
          message: 'Old password is incorrect',
          errors: [
            {
              field: 'oldPassword',
              message: 'The current password you provided is incorrect',
              code: 'INCORRECT_PASSWORD',
            },
          ],
        });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      this.logger.log(`Password changed successfully for user: ${userId}`);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error(`Password change failed for user ${userId}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to change password. Please try again later.',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred during password change',
          },
        ],
      });
    }
  }

  async refreshToken(user: CurrentUserData, refreshToken: string) {
    const startTime = Date.now();
    this.logger.log(
      `Token refresh attempt for user: ${user.userId}, session: ${user.jti}`,
    );

    try {
      // Measure user lookup time
      const userLookupStart = Date.now();
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.userId },
        select: { passwordChangedAt: true },
      });
      const userLookupTime = Date.now() - userLookupStart;
      this.logger.debug(`User lookup took ${userLookupTime}ms`);

      if (!userRecord) {
        this.logger.warn(`Token refresh failed: User ${user.userId} not found`);
        throw new UnauthorizedException({
          message: 'User for this token not found.',
        });
      }

      // Measure JWT verification time
      const jwtVerifyStart = Date.now();
      const payload = this.jwtRefresh.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const jwtVerifyTime = Date.now() - jwtVerifyStart;
      this.logger.debug(`JWT verification took ${jwtVerifyTime}ms`);

      if (userRecord.passwordChangedAt) {
        const tokenIssuedAt = new Date(payload.iat * 1000);
        if (tokenIssuedAt < userRecord.passwordChangedAt) {
          this.logger.warn(
            `Token refresh failed: Password changed for user ${user.userId}`,
          );
          throw new UnauthorizedException({
            message: 'This token is no longer valid due to a password change.',
          });
        }
      }

      // Measure stored token lookup time
      const tokenLookupStart = Date.now();
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          tokenHash: this.hash(refreshToken),
          userId: user.userId,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
      });
      const tokenLookupTime = Date.now() - tokenLookupStart;
      this.logger.debug(`Token lookup took ${tokenLookupTime}ms`);

      if (!storedToken) {
        this.logger.warn(
          `Token refresh failed: Invalid/revoked token for user ${user.userId}`,
        );
        throw new UnauthorizedException({
          message: 'Invalid or revoked refresh token',
          errors: [
            {
              field: 'refreshToken',
              message: 'The refresh token is invalid or has been revoked',
              code: 'TOKEN_REVOKED',
            },
          ],
        });
      }

      // Verify the JTI matches the current session (security check)
      if (storedToken.jti !== user.jti) {
        this.logger.warn(
          `Token refresh failed: JTI mismatch for user ${user.userId}. Stored: ${storedToken.jti}, Current: ${user.jti}`,
        );
        throw new UnauthorizedException({
          message: 'Session mismatch detected',
          errors: [
            {
              field: 'refreshToken',
              message: 'Invalid session context',
              code: 'SESSION_MISMATCH',
            },
          ],
        });
      }

      this.logger.log(
        `Revoking old refresh token for user: ${user.userId}, JTI: ${user.jti}`,
      );

      // Measure transaction time (revoke + generate)
      const transactionStart = Date.now();
      // Atomic operation: revoke old token + create new token in a transaction
      // This prevents race conditions where concurrent requests could both succeed
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await this.prisma.$transaction(async (tx) => {
          // 1. Revoke the old token
          await this.revokeRefresh(refreshToken, tx);

          // 2. Generate new token pair with the SAME JTI (session continuity)
          const tokens = await this.generateTokenPair(
            user.profileId,
            user.userId,
            user.jti,
            tx,
          );

          return tokens;
        });
      const transactionTime = Date.now() - transactionStart;
      this.logger.debug(`Transaction (revoke + generate) took ${transactionTime}ms`);

      // Cleanup old tokens AFTER successful token refresh (non-blocking)
      // This runs outside the transaction to avoid interference with concurrent requests
      this.cleanupOldTokens(user.userId).catch((err) => {
        this.logger.error(
          `Background cleanup failed for user ${user.userId}:`,
          err,
        );
      });

      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✓ Token refreshed successfully for user: ${user.userId}, session: ${user.jti} (Total: ${totalTime}ms)`,
      );

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      this.logger.error(`Token refresh failed for user ${user.userId}:`, error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to refresh token. Please try again later.',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred during token refresh',
          },
        ],
      });
    }
  }

  async logout(userId: string, jti?: string) {
    this.logger.log(
      `Logout attempt for user: ${userId}${jti ? ` (session: ${jti})` : ' (all sessions)'}`,
    );

    try {
      if (jti) {
        const result = await this.prisma.refreshToken.deleteMany({
          where: { userId, jti },
        });

        this.logger.log(
          `Logged out specific session for user ${userId}, JTI: ${jti}. Removed ${result.count} refresh token(s)`,
        );
      } else {
        const result = await this.prisma.refreshToken.deleteMany({
          where: { userId },
        });

        this.logger.log(
          `Full logout for user ${userId}. Removed ${result.count} refresh token(s)`,
        );
      }

      this.logger.log(`Logout completed for user: ${userId}`);
      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      this.logger.error(`Logout failed for user ${userId}:`, error);
      // Re-throw to be handled by NestJS exception filter
      throw new InternalServerErrorException('Logout failed');
    }
  }

  private async generateTokenPair(
    profileId: string,
    userId: string,
    existingJti?: string,
    tx?: any,
  ) {
    this.logger.log(
      `Generating token pair for user: ${userId}${existingJti ? ` with existing JTI: ${existingJti}` : ''}`,
    );

    try {
      // Use existing JTI for session continuity, or generate new one
      const jti = existingJti || crypto.randomUUID();
      const payload = {
        sub: userId,
        profileId,
        jti: jti,
        iat: Math.floor(Date.now() / 1000),
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      });

      const refreshToken = this.jwtRefresh.sign(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      });

      const prismaClient = tx || this.prisma;
      await prismaClient.refreshToken.create({
        data: {
          userId,
          jti: jti, // Store JTI to link tokens to session
          tokenHash: this.hash(refreshToken),
          expiresAt: new Date(
            Date.now() +
              parseInt(this.config.get('JWT_REFRESH_EXPIRES_MS', '604800000')),
          ),
        },
      });

      this.logger.log(
        `Token pair generated successfully for user: ${userId}, JTI: ${jti}`,
      );
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(
        `Failed to generate token pair for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to generate token pair');
    }
  }

  private async revokeRefresh(refreshToken: string, tx?: any) {
    const prismaClient = tx || this.prisma;
    await prismaClient.refreshToken.updateMany({
      where: { tokenHash: this.hash(refreshToken) },
      data: { revoked: true },
    });
  }

  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private async cleanupOldTokens(userId: string) {
    try {
      const expiredResult = await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          expiresAt: { lt: new Date() },
        },
      });

      if (expiredResult.count > 0) {
        this.logger.log(
          `Cleaned up ${expiredResult.count} expired tokens for user: ${userId}`,
        );
      }

      // Enforce configurable maximum active tokens per user to support multiple devices
      // Only count non-revoked and non-expired tokens
      const maxTokens = parseInt(
        this.config.get('MAX_REFRESH_TOKENS_PER_USER', '15'),
      );

      const activeTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          revoked: false,
          expiresAt: { gt: new Date() }, // Only count tokens that haven't expired
        },
        orderBy: { createdAt: 'desc' },
      });

      if (activeTokens.length > maxTokens) {
        const tokensToDelete = activeTokens.slice(maxTokens);
        await this.prisma.refreshToken.deleteMany({
          where: { id: { in: tokensToDelete.map((t) => t.id) } },
        });
        this.logger.log(
          `Removed ${tokensToDelete.length} excess tokens for user: ${userId} (max: ${maxTokens})`,
        );
      }
    } catch (error) {
      // Don't fail the request if cleanup fails
      this.logger.error(
        `Token cleanup failed for user ${userId} (non-critical):`,
        error,
      );
    }
  }

  private async createGoogleProfile(
    userId: string,
    email: string,
    type: UserType,
    picture: string,
    tx: any,
  ) {
    const baseData = { userId, avatar: picture };

    switch (type) {
      case UserType.COMPANY:
        return await tx.company.create({
          data: { ...baseData, onboardingSteps: [1] },
        });

      case UserType.PLAYER:
        return await tx.player.create({
          data: { ...baseData, onboardingSteps: [1, 2, 3] },
        });

      case UserType.SUPPORTER:
        return await tx.player.create({
          data: {
            ...baseData,
            onboardingSteps: [1, 2, 3],
          },
        });

      default:
        throw new BadRequestException({
          message: `Unsupported user type: ${type}`,
          errors: [
            {
              field: 'userType',
              message: 'Invalid user type provided',
              code: 'INVALID_USER_TYPE',
            },
          ],
        });
    }
  }

  private async validateSignupRequest(signupDto: SignupDto) {
    const { userType, email, refCode } = signupDto;

    // All users need refCode
    if (!refCode) {
      throw new BadRequestException({
        message: 'Reference code is required',
        errors: [
          {
            field: 'refCode',
            message: 'Reference code is required',
            code: 'REQUIRED_FIELD',
          },
        ],
      });
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, userType: true, status: true },
    });

    if (existingUser) {
      // Allow invited Club accounts in PENDING status to continue
      if (
        !(
          existingUser.userType === UserType.CLUB &&
          existingUser.status === UserStatus.PENDING
        )
      ) {
        throw new ConflictException({
          message: 'An account with this email already exists',
          errors: [
            {
              field: 'email',
              message: 'Email already registered',
              code: 'DUPLICATE_VALUE',
            },
          ],
        });
      }
    } else if (userType === UserType.CLUB) {
      // If userType is CLUB but no existing user found, this is invalid
      throw new BadRequestException({
        message: 'Club invitation not found. Use invitation email',
        errors: [
          {
            field: 'email',
            message: 'No pending club invitation found for this email',
            code: 'CLUB_INVITATION_NOT_FOUND',
          },
        ],
      });
    }

    // Validate refCode for all users and return club data for non-club users
    const validationResult = await this.validateRefCode(
      refCode,
      userType,
      email,
    );

    return validationResult;
  }

  private async performOtpVerification(
    email: string,
    otp: string,
    type: OtpType,
  ) {
    const verifiedOtp = await this.otpUtils.verifyOtp(email, otp, type);

    //* Only check user association for types that require it
    const userRequiredTypes: OtpType[] = [OtpType.PASSWORD_RESET];

    if (userRequiredTypes.includes(type) && !verifiedOtp.user) {
      throw new UnauthorizedException({
        message: 'Invalid OTP or user association',
      });
    }

    return verifiedOtp;
  }

  private generateOtpVerificationResponse(verifiedOtp: any, type: OtpType) {
    switch (type) {
      case OtpType.PASSWORD_RESET:
        const resetToken = this.jwtService.sign(
          {
            sub: verifiedOtp.user.id,
            otpId: verifiedOtp.id,
            purpose: 'password-reset',
          },
          { expiresIn: '15m' },
        );

        return {
          success: true,
          message:
            'OTP verified successfully. Use the token to reset your password.',
          data: { resetToken },
        };

      default:
        return {
          success: true,
          message: 'OTP verified successfully.',
          data: {
            email: verifiedOtp.email,
            userId: verifiedOtp.user?.id,
            affiliateId: verifiedOtp.affiliateId,
          },
        };
    }
  }

  private async validateRefCode(
    refCode: string,
    userType: UserType,
    email: string,
  ): Promise<{ clubData?: any }> {
    if (userType === UserType.CLUB) {
      const existingClub = await this.prisma.club.findFirst({
        where: {
          refCode,
          user: {
            email,
            userType: UserType.CLUB,
            status: UserStatus.PENDING,
          },
        },
        select: {
          id: true,
          user: { select: { email: true } },
        },
      });

      if (!existingClub) {
        throw new BadRequestException({
          message: 'Invalid reference code for club registration',
          errors: [
            {
              field: 'refCode',
              message: 'Reference code does not match your club invitation',
              code: 'INVALID_CLUB_REF_CODE',
            },
          ],
        });
      }

      return {}; // No club data needed for club users
    } else {
      // For all other user types (PLAYER, COMPANY, SUPPORTER), validate refCode exists
      const club = await this.prisma.club.findFirst({
        where: { refCode },
        select: {
          id: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!club) {
        throw new BadRequestException({
          message: 'Invalid reference code',
          errors: [
            {
              field: 'refCode',
              message: 'Reference code not found',
              code: 'INVALID_REF_CODE',
            },
          ],
        });
      }

      // ONLY validate invitation for PLAYER type
      if (userType === UserType.PLAYER) {
        const affiliateInvitation = await this.prisma.affiliate.findFirst({
          where: {
            email,
            clubId: club.id,
            status: AffiliateStatus.PENDING,
          },
        });

        if (!affiliateInvitation) {
          throw new BadRequestException({
            message: 'You have not been invited by this club',
            errors: [
              {
                field: 'email',
                message:
                  'No pending invitation found for this email from the club',
                code: 'NO_INVITATION_FOUND',
              },
            ],
          });
        }
      }

      // COMPANY and SUPPORTER don't need invitation check
      // They just need a valid refCode to affiliate with a club

      return { clubData: club }; // Return club data for affiliation
    }
  }

  private async createProfile(userId: string, type: UserType, tx: any) {
    switch (type) {
      case UserType.COMPANY:
        return await tx.company.create({
          data: { userId, onboardingSteps: [1] },
        });

      case UserType.PLAYER:
      case UserType.SUPPORTER:
        return await tx.player.create({
          data: { userId, onboardingSteps: [1, 2, 3] },
        });
      default:
        throw new BadRequestException({
          message: `Unsupported user type: ${type}`,
          errors: [
            {
              field: 'userType',
              message: 'Invalid user type provided',
              code: 'INVALID_USER_TYPE',
            },
          ],
        });
    }
  }

  private async handleRefCode(
    refCode: string,
    userType: UserType,
    email: string,
    user: any,
    clubData: any,
    tx: any,
  ) {
    if (userType !== UserType.CLUB) {
      // Use the club data from validation instead of querying again
      if (!clubData) {
        throw new BadRequestException('Club data not found for reference code');
      }

      await this.upsertAffiliate(
        {
          email,
          clubId: clubData.id,
          userId: user.id,
          type: userType,
          refCode,
        },
        tx,
      );
    }
  }

  private async upsertAffiliate(
    otps: {
      email: string;
      clubId: string;
      userId: string;
      type: string;
      refCode: string;
    },
    tx: any,
  ) {
    const existing = await tx.affiliate.findFirst({
      where: { email: otps.email, clubId: otps.clubId },
    });

    if (existing) {
      return await tx.affiliate.update({
        where: { id: existing.id },
        data: { status: AffiliateStatus.ACTIVE, userId: otps.userId },
      });
    }

    return await tx.affiliate.create({
      data: {
        purpose: 'To join',
        type: otps.type,
        email: otps.email,
        userId: otps.userId,
        clubId: otps.clubId,
        refCode: otps.refCode,
        status: AffiliateStatus.ACTIVE,
      },
    });
  }

  private async getUserProfileData(userType: UserType, userId: string) {
    let userDoc: any;
    let affiliate: any;

    switch (userType) {
      case UserType.CLUB:
        userDoc = await this.prisma.club.findUnique({
          where: { userId },
          include: { user: true },
        });

        return {
          id: userDoc.id,
          name: userDoc.name,
          email: userDoc.user.email,
          userType: userType.toLowerCase(),
          onboardingSteps: userDoc.onboardingSteps || [],
          about: userDoc.about,
          avatar: userDoc.avatar,
          banner: userDoc.banner,
          tagline: userDoc.tagline,
          category: userDoc.category,
          address: userDoc.address,
          country: userDoc.country,
          region: userDoc.region,
          website: userDoc.website,
          phone: userDoc.phone,
          focus: userDoc.focus,
          status: userDoc.user.status?.toLowerCase(),
          founded: userDoc.founded,
          refCode: userDoc.refCode,
          sponsorshipOpportunities: userDoc.sponsorshipOpportunities,
          sponsorshipPrograms: userDoc.sponsorshipPrograms,
          socials: userDoc.socials,
          preferredColor: userDoc.preferredColor,
          isApproved: true,
        };

      case UserType.COMPANY:
        userDoc = await this.prisma.company.findUnique({
          where: { userId },
          include: { user: true },
        });

        affiliate = await this.prisma.affiliate.findFirst({
          where: { userId },
          include: { club: true },
        });

        const companyProfile: any = {
          id: userDoc.id,
          name: userDoc.name,
          email: userDoc.user.email,
          availability: userDoc.availability,
          userType: userType.toLowerCase(),
          region: userDoc.region,
          address: userDoc.address,
          onboardingSteps: userDoc.onboardingSteps,
          about: userDoc.about,
          avatar: userDoc.avatar,
          tagline: userDoc.tagline,
          industry: userDoc.industry,
          focus: userDoc.focus,
          status: userDoc.user.status?.toLowerCase(),
          preferredClubs: userDoc.preferredClubs,
          country: userDoc.country,
          isApproved: affiliate?.isApproved,
          isQuestionnaireTaken: userDoc.isQuestionnaireTaken,
        };

        if (userDoc.isQuestionnaireTaken) {
          companyProfile.score = userDoc.score;
          companyProfile.analysisResult = userDoc.analysisResult;
        }

        return companyProfile;

      case UserType.PLAYER:
      case UserType.SUPPORTER:
        userDoc = await this.prisma.player.findUnique({
          where: { userId },
          include: {
            user: true,
            club: true,
            experiences: true,
          },
        });

        affiliate = await this.prisma.affiliate.findFirst({
          where: { userId },
          include: { club: true },
        });

        const playerProfile: any = {
          id: userDoc.id,
          name: userDoc.name,
          email: userDoc.user.email,
          userType: userDoc.user.userType?.toLowerCase(),
          about: userDoc.about,
          address: userDoc.address,
          country: userDoc.workCountry,
          workLocations: userDoc.workCountry,
          employmentType: userDoc.employmentType,
          traits: userDoc.traits,
          skills: userDoc.skills,
          resume: userDoc.resume,
          phone: userDoc.phone,
          workAvailability: userDoc.availability,
          experiences: userDoc.experiences,
          shirtNumber: userDoc.shirtNumber,
          birthYear: userDoc.birthYear,
          sportsHistory: userDoc.sportsHistory,
          avatar: userDoc.avatar,
          status: userDoc.user.status?.toLowerCase(),
          onboardingSteps: userDoc.onboardingSteps,
          yearsOfExperience: userDoc.yearsOfExperience,
          certifications: userDoc.certifications,
          score: userDoc.score,
          isQuestionnaireTaken: userDoc.isQuestionnaireTaken,
          club: userDoc.club
            ? {
                id: userDoc.club.id,
                name: userDoc.club.name,
                avatar: userDoc.club.avatar,
                banner: userDoc.club.banner,
              }
            : {},
          industry: userDoc.industry,
          isApproved: affiliate?.isApproved,
        };

        if (userDoc.isQuestionnaireTaken) {
          playerProfile.score = userDoc.score;
          playerProfile.analysisResult = userDoc.analysisResult;
        }

        return playerProfile;

      case UserType.ADMIN:
        userDoc = await this.prisma.admin.findUnique({
          where: { userId },
          include: { user: true },
        });

        return {
          id: userDoc.id,
          name: userDoc.name,
          email: userDoc.user.email,
          userType: userDoc.user.userType?.toLowerCase(),
          about: userDoc.about,
          avatar: userDoc.avatar,
          status: userDoc.user.status?.toLowerCase(),
        };

      default:
        throw new UnauthorizedException({
          message: 'Invalid user type',
          errors: [{ field: 'userType', message: 'Unsupported user type' }],
        });
    }
  }

  private async sendVerificationEmailAsync(
    email: string,
    otp: string,
  ): Promise<void> {
    try {
      await this.emailService.sendAccountCreatedAndVeriifcationEmail(
        email,
        otp,
      );
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}:`,
        error,
      );
      // Don't throw - signup should still succeed
    }
  }

  private async sendPasswordResetEmailAsync(
    email: string,
    otp: string,
  ): Promise<void> {
    try {
      await this.emailService.sendPasswordResetEmail(email, otp);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}:`,
        error,
      );
    }
  }

  private async sendPasswordResetConfirmationAsync(
    email: string,
  ): Promise<void> {
    try {
      await this.emailService.sendPasswordResetConfirmationEmail(email);
      this.logger.log(`Password reset confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset confirmation to ${email}:`,
        error,
      );
    }
  }

  private async createLoginNotificationAsync(userId: string): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'New login',
          message: 'You just successfully logged in',
          type: 'SYSTEM',
          status: 'UNREAD',
        },
      });
      this.logger.log(`Login notification created for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create login notification for user ${userId}:`,
        error,
      );
      //* Don't throw - login should still succeed
    }
  }
}
