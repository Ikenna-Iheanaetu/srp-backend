/** @format */

import { z } from "zod";
import { UserTypeSchema } from "./user";

// could use server-side check, but oh Lord, I'm tired of John.
const AccessTokenSchema = z.string().min(1, "Access token is invalid");
const RefreshTokenSchema = z.string().min(1, "Refresh token is invalid");

export const AuthCookiesSchema = z.object({
	accessToken: AccessTokenSchema,
	refreshToken: RefreshTokenSchema,
	userType: UserTypeSchema,
});

export type AuthCookies = z.infer<typeof AuthCookiesSchema>;

/************DEMACATION**************/

// Success case for authenticated status
export const AuthSuccessSchema = z.object({
	isAuthenticated: z.literal(true),
	cookies: z.object({
		accessToken: AccessTokenSchema,
		refreshToken: RefreshTokenSchema,
		userType: UserTypeSchema,
	}),
});

export type AuthSuccess = z.infer<typeof AuthSuccessSchema>;

// Base schema for unauthenticated status
const AuthErrorBaseSchema = z.object({
	isAuthenticated: z.literal(false),
	cookies: z.literal(null),
});

// Client-specific error schema

// Client-specific error schema
export const AuthClientErrorSchema = AuthErrorBaseSchema.merge(
	z.object({
		error: z.object({
			type: z.enum(["INVALID_BROWSER_CONTEXT", "INVALID_AUTH_COOKIES"]),
			message: z.string(),
		}),
	})
);

export type AuthClientError = z.infer<typeof AuthClientErrorSchema>;

// Server-specific error schema
export const AuthServerErrorSchema = AuthErrorBaseSchema.merge(
	z.object({
		error: z.object({
			type: z.literal("INVALID_SESSION_API_ERROR"),
			message: z.string(),
		}),
	})
);

export type AuthServerError = z.infer<typeof AuthServerErrorSchema>;

// Union of all error schemas
export const AuthErrorSchema = z.union([
	AuthClientErrorSchema,
	AuthServerErrorSchema,
]);

export type AuthError = z.infer<typeof AuthErrorSchema>;

// Client-specific auth status (success or client error)
export const ClientAuthStatusSchema = z.union([
	AuthSuccessSchema,
	AuthClientErrorSchema,
]);

export type ClientAuthStatus = z.infer<typeof ClientAuthStatusSchema>;

// Server-specific auth status (success or server error)
export const ServerAuthStatusSchema = z.union([
	AuthSuccessSchema,
	AuthServerErrorSchema,
]);

export type ServerAuthStatus = z.infer<typeof ServerAuthStatusSchema>;

// Combined auth status (success or any error)
export const AuthStatusSchema = z.union([AuthSuccessSchema, AuthErrorSchema]);

export type AuthStatus = z.infer<typeof AuthStatusSchema>;
