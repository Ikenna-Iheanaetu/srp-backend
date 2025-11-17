/** @format */

import { logoutUser } from "@/hooks/use-logout";
import { AuthCookiesSchema, ClientAuthStatus } from "@/lib/schemas/auth";
import { getCookie } from "./utils";
import { AUTH_COOKIE_KEYS } from "./constants";

/**
 * Checks authentication status from cookies, mostly for route client loaders.
 * * For component-level auth checks, use the {@link useAuthStatus} hook instead.
 */
export const getAuthStatusFromCookies = (): ClientAuthStatus => {
	if (typeof window === "undefined") {
		return {
			isAuthenticated: false,
			cookies: null,
			error: {
				type: "INVALID_BROWSER_CONTEXT",
				message: "Browser window is not available - " + typeof window,
			},
		} as const;
	}

	const cookieData = {
		accessToken: getCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN),
		refreshToken: getCookie(AUTH_COOKIE_KEYS.REFRESH_TOKEN),
		userType: getCookie(AUTH_COOKIE_KEYS.USER_TYPE),
	};

	const result = AuthCookiesSchema.safeParse(cookieData);

	if (!result.success) {
		logoutUser();
		const errorMessage =
			result.error.errors.map((err) => err.message).join(", ") ||
			"Invalid authentication cookies";
		return {
			isAuthenticated: false,
			cookies: null,
			error: {
				type: "INVALID_AUTH_COOKIES",
				message: errorMessage,
			},
		} as const;
	}

	return {
		isAuthenticated: true,
		cookies: result.data,
	} as const;
};
