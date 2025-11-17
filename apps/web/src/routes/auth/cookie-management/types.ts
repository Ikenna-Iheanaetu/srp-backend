/** @format */

import { UserType } from "@/lib/schemas/user";

export interface UserTypeCookieParams {
	userType: UserType;
}

export interface AuthTokenCookieParams {
	accessToken: string;
	refreshToken: string;
}

export type AuthCookiesParams = AuthTokenCookieParams &
	Pick<UserTypeCookieParams, "userType">;
