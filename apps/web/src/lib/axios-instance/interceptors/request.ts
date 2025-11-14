/** @format */

import { UserType } from "@/lib/schemas/user";
import { getAuthStatusFromCookies } from "@/routes/auth/cookie-management/get-auth-status-helper";
import { InternalAxiosRequestConfig } from "axios";

/**
 * Determines if a URL should be prefixed with user type.
 * @example
 * shouldPrefixUserType("/company/jobs")    // false - already has user type
 * shouldPrefixUserType("/club/teams")      // false - already has user type
 * shouldPrefixUserType("/player/profile")  // false - already has user type
 * shouldPrefixUserType("/profile")         // true - needs prefix
 * @param subRoute The URL path to check (e.g. "/profile" or "/club/teams")
 * @returns True if the path should be prefixed with user type
 */
const shouldPrefixUserType = ({
	subRoute,
	authenticatedUserType,
}: {
	subRoute: string;
	authenticatedUserType: UserType;
}) => {
	const firstPart = subRoute.split("/")[1];
	return firstPart !== authenticatedUserType;
};

/**
 * Request interceptor that handles:
 * - Authentication token injection
 * - User type URL prefixing
 * Both can be skipped using config flags.
 */
export const requestInterceptor = (config: InternalAxiosRequestConfig) => {
	const authStatus = getAuthStatusFromCookies();
	// Handle authentication
	if (!config.skipAuthHeader) {
		if (!authStatus.isAuthenticated) {
			throw new Error(
				"[requestInterceptor]: Cannot retrieve 'authToken', 'skipAuthHeader' is false but user is not authenticated.",
			);
		}

		const accessToken = authStatus.cookies.accessToken;
		if (accessToken) {
			config.headers = config.headers ?? {};
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
	}
	// Handle URL prefixing
	// config.url is the path part of the URL, excluding baseURL
	// e.g. if baseURL is "https://api.example.com" and you call
	// axios.get("/profile"), config.url will be "/profile"
	if (!config.skipUserTypePrefix && config.url) {
		if (!authStatus.isAuthenticated) {
			throw new Error(
				"[requestInterceptor]: Cannot retrieve user type, 'skipUserTypePrefix' is 'false' but user is not authenticated.",
				{
					cause: authStatus,
				},
			);
		}
		const userType = authStatus.cookies.userType;

		if (!userType) {
			throw new Error(
				"[requestInterceptor]: User is authenticated but 'userType' is missing in cookies.",
				{
					cause: authStatus,
				},
			);
		}

		if (
			userType &&
			shouldPrefixUserType({
				subRoute: config.url,
				authenticatedUserType: userType,
			})
		) {
			// Transform paths based on user type:
			// "/profile" → "/company/profile"
			// "/jobs"    → "/club/jobs"
			// "/stats"   → "/player/stats"
			// "/feed"    → "/supporter/feed"
			config.url = `/${userType}${config.url}`;
		}
	}

	return config;
};
