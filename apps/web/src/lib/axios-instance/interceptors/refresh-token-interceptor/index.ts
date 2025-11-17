/** @format */

import { getAuthStatusFromCookies } from "@/routes/auth/cookie-management/get-auth-status-helper";
import { AxiosInstance, AxiosResponse } from "axios";
import { apiErrorSignal } from "../../api-error-signal";
import { isAxiosApiError } from "../../utils";
import { AxiosAuthRefreshCache, AxiosAuthRefreshOptions } from "./types";
import {
	createRefreshCall,
	createRequestQueueInterceptor,
	defaultOptions,
	getRetryInstance,
	mergeOptions,
	resendFailedRequest,
	shouldInterceptError,
	unsetCache,
} from "./utils";
import { logoutUser } from "@/hooks/use-logout";

/**
 * Creates an authentication refresh interceptor that binds to any error response.
 *
 * If the response status code is one of the options.statusCodes, interceptor calls the refreshAuthCall
 * which must return a Promise.
 *
 * While refreshAuthCall is running, all the new requests are intercepted and are waiting
 * for the refresh call to resolve.
 *
 * While running the refreshing call, instance provided is marked as a paused instance
 * which indicates the interceptor to not intercept any responses from it. This is because you'd otherwise need to mark
 * the specific requests you make by yourself in order to make sure it's not intercepted. This behavior can be
 * turned off, but use it with caution as you need to mark the requests with `skipAuthRefresh` flag yourself in order to
 * not run into interceptors loop.
 *
 * @return {number} - interceptor id (in case you want to eject it manually)
 */
export function createAuthRefreshInterceptor({
	instance,
	refreshAuthCall,
	options = {},
}: {
	instance: AxiosInstance;
	refreshAuthCall: (error: unknown) => Promise<unknown>;
	options?: AxiosAuthRefreshOptions;
}): number {
	const cache: AxiosAuthRefreshCache = {
		skipInstances: [],
		refreshCall: undefined,
		requestQueueInterceptorId: undefined,
	};

	let refreshingPromise: Promise<unknown> | null = null;
	let isInterceptorActive = false;

	const AUTO_REFRESH_INTERVAL = 5000 * 60; // 5 mins
	setInterval(() => {
		const { isAuthenticated } = getAuthStatusFromCookies();
		if (refreshingPromise || !isAuthenticated) {
			return;
		}

		const refreshAttempt = refreshAuthCall(null);
		refreshingPromise = refreshAttempt;

		refreshAttempt
			.catch((error) => {
				if (isInterceptorActive) {
					throw error; // allow interceptor to handle the error
				}
				if (isAxiosApiError(error)) {
					if (error.status === 401) {
						logoutUser();
					}
				}
			})
			.finally(() => {
				refreshingPromise = null;
			});
	}, AUTO_REFRESH_INTERVAL);

	return instance.interceptors.response.use(
		(response: AxiosResponse) => response,
		async (error) => {
			options = mergeOptions({ defaults: defaultOptions, options });

			if (!shouldInterceptError({ error, options, instance, cache })) {
				const isRefreshInProgress = !!cache.refreshCall;

				if (!isRefreshInProgress && isAxiosApiError(error)) {
					apiErrorSignal.emit(error);
				}

				throw error;
			}
			isInterceptorActive = true;

			if (options.pauseInstanceWhileRefreshing) {
				cache.skipInstances.push(instance);
			}

			// If refresh call does not exist, create one
			if (!refreshingPromise) {
				refreshingPromise = createRefreshCall({
					error,
					fn: refreshAuthCall,
					cache,
				});
			}

			// Create interceptor that will bind all the others requests until refreshAuthCall is resolved
			createRequestQueueInterceptor({ instance, cache, options });

			try {
				await refreshingPromise;

				return resendFailedRequest({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					error,
					instance: getRetryInstance({ instance, options }),
				});
			} catch (e) {
				// if refresh auth fails, emit the error
				if (isAxiosApiError(e)) {
					apiErrorSignal.emit(e);
				}
				throw e;
			} finally {
				refreshingPromise = null;
				isInterceptorActive = false;
				unsetCache({ instance, cache });
			}
		},
	);
}
