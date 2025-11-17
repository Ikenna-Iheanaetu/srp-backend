import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignupDto } from './dto/sign-up.dto';
import { ApiResponseDecorator } from 'src/common/decorators/api-response.decorator';
import { SignupResponseDto } from './dto/responses/sign-up-response.dto';
import { ErrorResponseDto } from 'src/common/dto/base-response.dto';
import { LoginResponseDto } from './dto/responses/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleSignupDto } from './dto/google-signup.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResendOtpResponseDto } from './dto/responses/resend-otp-response.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForgotPasswordResponseDto } from './dto/responses/forgot-password-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordResponseDto } from './dto/responses/reset-password-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard, TokenType } from 'src/common/guards/auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from 'src/common/decorators/current-user.decorator';
import { ChangePasswordResponseDto } from './dto/responses/change-password-response.dto';
import { RefreshTokenResponseDto } from './dto/responses/refresh-token-reponse.dto';
import { VerifyAccountResponseDto } from './dto/responses/verify-account-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyOtpResponseDto } from './dto/responses/verify-otp-response.dto';
import { LogoutResponseDto } from './dto/responses/logout-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponseDecorator(
    HttpStatus.CREATED,
    'User registered successfully',
    SignupResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.CONFLICT,
    'User already exists',
    ErrorResponseDto,
  )
  @ApiBody({ type: SignupDto })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponseDecorator(HttpStatus.OK, 'Login successful', LoginResponseDto)
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized',
    ErrorResponseDto,
  )
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('google-signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration with Google OAuth' })
  @ApiResponseDecorator(
    HttpStatus.CREATED,
    'User registered successfully with Google',
    SignupResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.CONFLICT,
    'User already exists',
    ErrorResponseDto,
  )
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Invalid Google token',
    ErrorResponseDto,
  )
  @ApiBody({ type: GoogleSignupDto })
  async googleSignup(@Body() dto: GoogleSignupDto) {
    return this.authService.googleSignup(dto);
  }

  @Post('google-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with Google OAuth' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Google login successful',
    LoginResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized or invalid Google token',
    ErrorResponseDto,
  )
  @ApiBody({ type: GoogleLoginDto })
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP for email verification' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'OTP resent successfully',
    ResendOtpResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiBody({ type: ResendOtpDto })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('verify-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify account with OTP' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Account verified successfully',
    VerifyAccountResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Invalid or expired OTP',
    ErrorResponseDto,
  )
  @ApiBody({ type: VerifyAccountDto })
  async verifyAccount(@Body() dto: VerifyAccountDto) {
    return this.authService.verifyAccount(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset OTP to email' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Password reset OTP sent successfully',
    ForgotPasswordResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'User not found',
    ErrorResponseDto,
  )
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset OTP and get reset token' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'OTP verified successfully. Use the token to reset your password.',
    VerifyOtpResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Invalid or expired OTP',
    ErrorResponseDto,
  )
  @ApiBody({ type: VerifyOtpDto })
  async verifyPasswordResetOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Password reset successfully',
    ResetPasswordResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Invalid or expired token',
    ErrorResponseDto,
  )
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Password changed successfully',
    ChangePasswordResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized',
    ErrorResponseDto,
  )
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.authService.changePassword(dto, userId);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @TokenType('refresh')
  @ApiOperation({
    summary:
      'Refresh access token using refresh token from Authorization header',
  })
  @ApiResponseDecorator(
    HttpStatus.OK,
    'Token refreshed successfully',
    RefreshTokenResponseDto,
  )
  @ApiResponseDecorator(HttpStatus.BAD_REQUEST, 'Bad request', ErrorResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Invalid refresh token',
    ErrorResponseDto,
  )
  @ApiHeader({
    name: 'authorization',
    description: 'Bearer refresh_token',
    required: true,
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  async refreshTokenFlexible(
    @CurrentUser() user: CurrentUserData,
    @Req() request: Request & { refreshToken: string },
  ) {
    return this.authService.refreshToken(user, request.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Logout user from the current session',
    description:
      'Invalidates the refresh token associated with the current session (JTI).',
  })
  @ApiResponseDecorator(HttpStatus.OK, 'Logout successful', LogoutResponseDto)
  @ApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized',
    ErrorResponseDto,
  )
  async logout(@CurrentUser() user: CurrentUserData) {
    return this.authService.logout(user.userId, user.jti);
  }
}
