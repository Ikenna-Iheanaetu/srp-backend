/** @format */

import { getAuthStatusFromCookies } from "@/routes/auth/cookie-management/get-auth-status-helper";
import { setAuthCookies } from "@/routes/auth/cookie-management/utils";
import axios from "axios";
import { z } from "zod/v4";
import { AuthCookies } from "../schemas/auth";
import { createAuthRefreshInterceptor } from "./interceptors/refresh-token-interceptor";
import { requestInterceptor } from "./interceptors/request";
import { ApiSuccessResponse, AuthorizationBearer } from "./types";

const baseURL =
	z
		.string({
			error: "Invalid Environment variable 'VITE_API_URL'",
		})
		.parse(import.meta.env.VITE_API_URL) + "/api/v1";

const apiAxiosInstance = axios.create({
	baseURL,
});

// Add interceptors
apiAxiosInstance.interceptors.request.use(requestInterceptor);

const handleRefreshAuth = async () => {
	const { isAuthenticated, cookies } = getAuthStatusFromCookies();
	if (!isAuthenticated) {
		throw new Error(
			"Refreshing auth is not possible if user wasn't initially authenticated.",
		);
	}

	const refreshToken = cookies.refreshToken;

	const response = await axios.post<
		ApiSuccessResponse<{
			data: Pick<AuthCookies, "accessToken" | "refreshToken">;
		}>
	>(baseURL + "/auth/refresh-token", undefined, {
		headers: {
			Authorization:
				`Bearer ${refreshToken}` satisfies AuthorizationBearer,
		},
	});

	const newTokens = response.data.data;
	setAuthCookies({
		...newTokens,
		// re-save user type again to have the same expiry date as the new tokens
		userType: cookies.userType,
	});
};

// the auth refresh response interceptor must be registered first before any other interceptors, to make sure 401 responses reach it first.
createAuthRefreshInterceptor({
	instance: apiAxiosInstance,
	refreshAuthCall: handleRefreshAuth,
	options: {
		pauseInstanceWhileRefreshing: true,
	},
});

export { apiAxiosInstance };

/**@deprecated Use the named export {@link apiAxiosInstance} instead. */
export default apiAxiosInstance;
