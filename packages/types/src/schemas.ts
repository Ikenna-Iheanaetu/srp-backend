import { z } from 'zod';

// User Type Enum
export const UserTypeSchema = z.enum(['ADMIN', 'PLAYER', 'CLUB', 'COMPANY']);

// Base User Schema
export const BaseUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  userType: UserTypeSchema,
  isEmailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  userType: UserTypeSchema,
});

export const GoogleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export const GoogleSignUpSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
  userType: UserTypeSchema,
});

// Password Management Schemas
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Account Verification Schemas
export const VerifyAccountSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const ResendOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Company Schemas
export const InviteCompanySchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const GetCompaniesSchema = z.object({
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
  search: z.string().optional(),
});

// Club Schemas
export const InviteClubSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const GetClubsSchema = z.object({
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
  search: z.string().optional(),
});

// Pagination Schema
export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

// Base Response Schema
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  meta: PaginationMetaSchema.optional(),
});
