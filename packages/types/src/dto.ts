// User Types
export type UserType = 'ADMIN' | 'PLAYER' | 'CLUB' | 'COMPANY';

export interface BaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth DTOs
export interface LoginDTO {
  email: string;
  password: string;
}

export interface SignUpDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
}

export interface LoginResponse {
  user: BaseUser;
  accessToken: string;
  refreshToken: string;
}

export interface SignUpResponse {
  message: string;
  user: Partial<BaseUser>;
}

// Google Auth DTOs
export interface GoogleLoginDTO {
  credential: string;
}

export interface GoogleSignUpDTO {
  credential: string;
  userType: UserType;
}

// Password Management DTOs
export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

// Account Verification DTOs
export interface VerifyAccountDTO {
  email: string;
  otp: string;
}

export interface ResendOtpDTO {
  email: string;
}

// Company DTOs
export interface InviteCompanyDTO {
  email: string;
}

export interface GetCompaniesDTO {
  page?: number;
  limit?: number;
  search?: string;
}

// Club DTOs
export interface InviteClubDTO {
  email: string;
}

export interface GetClubsDTO {
  page?: number;
  limit?: number;
  search?: string;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Base Response
export interface BaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}
