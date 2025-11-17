/** @format */

import { AxiosResponse } from "axios";
import { apiErrorSignal } from "../api-error-signal";
import { AxiosApiError } from "../types";

/**
 * Response interceptor configuration.
 * Handles successful responses and error cases.
 */
export const responseInterceptor = {
	/** Pass through successful responses unchanged */
	onFulfilled: <T>(response: AxiosResponse<T>) => response,

	/**
	 * Handle errors by:
	 * 1. Emitting to global error handlers
	 * 2. Allowing local error handling through promise rejection
	 */
	onRejected: <T extends AxiosApiError>(error: T) => {
		// NOTE: The primary handler was moved to **React Query's global caches**. This prevents a **401** from causing a logout after a successful token refresh, as the `useAuthStatus` listener would still receive the error from this signal. This interceptor may still be needed to catch all errors from apiAxiosInstance since not all requests may use React Query.
		apiErrorSignal.emit(error);
		return Promise.reject<T>(error);
	},
};
