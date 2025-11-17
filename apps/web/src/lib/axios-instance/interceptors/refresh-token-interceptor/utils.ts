/** @format */

import axios, {
	AxiosError,
	AxiosInstance,
	AxiosPromise,
	AxiosResponse,
	isAxiosError,
} from "axios";
import { AxiosAuthRefreshCache, AxiosAuthRefreshOptions } from "./types";

export const defaultOptions: AxiosAuthRefreshOptions = {
	statusCodes: [401],
	pauseInstanceWhileRefreshing: false,
};

/**
 * Merges two options objects (options overwrites defaults).
 */
export function mergeOptions({
	defaults,
	options,
}: {
	defaults: AxiosAuthRefreshOptions;
	options: AxiosAuthRefreshOptions;
}): AxiosAuthRefreshOptions {
	return {
		...defaults,
		...options,
	};
}

/**
 * Returns TRUE: when error.response.status is contained in options.statusCodes
 * Returns FALSE: when error or error.response doesn't exist or options.statusCodes doesn't include response status.
 */
export function shouldInterceptError({
	error,
	options,
	instance,
	cache,
}: {
	error: unknown;
	options: AxiosAuthRefreshOptions;
	instance: AxiosInstance;
	cache: AxiosAuthRefreshCache;
}): boolean {
	if (!error) {
		return false;
	}

	if (!isAxiosError(error)) {
		return false;
	}

	if (error.config?.skipAuthRefresh) {
		return false;
	}

	const isNetworkError =
		options.interceptNetworkError &&
		!error.response &&
		!!error.request &&
		typeof error.request === "object" &&
		"status" in error.request &&
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		error.request.status === 0;

	const isStatusCodeRefreshable = options?.shouldRefresh
		? options.shouldRefresh(error)
		: error.response &&
		  options.statusCodes?.includes(
				typeof error.response.status === "string"
					? // for cases where api might incorrectly send refreshable status as string
					  parseInt(error.response.status)
					: error.response.status
		  );

	if (!isNetworkError && !isStatusCodeRefreshable) {
		return false;
	}

	// Copy config to response if there's a network error, so config can be modified and used in the retry
	if (!error.response && error.config) {
		error.response = {
			config: error.config,
		} as AxiosResponse;
	}

	const shouldNotPause = !options.pauseInstanceWhileRefreshing;
	const isInstanceNotSkipped = !cache.skipInstances.includes(instance);

	return shouldNotPause || isInstanceNotSkipped;
}

/**
 * Creates refresh call if it does not exist or returns the existing one.
 */
export function createRefreshCall({
	error,
	fn,
	cache,
}: {
	error: unknown;
	fn: (error: unknown) => Promise<unknown>;
	cache: AxiosAuthRefreshCache;
}) {
	if (!cache.refreshCall) {
		cache.refreshCall = fn(error);
	}
	return cache.refreshCall;
}

/**
 * Creates request queue interceptor if it does not exist and returns its id.
 */
export function createRequestQueueInterceptor({
	instance,
	cache,
	options,
}: {
	instance: AxiosInstance;
	cache: AxiosAuthRefreshCache;
	options: AxiosAuthRefreshOptions;
}): number {
	if (typeof cache.requestQueueInterceptorId === "undefined") {
		cache.requestQueueInterceptorId = instance.interceptors.request.use(
			async (request) => {
				try {
					await cache.refreshCall;

					return options.onRetry ? options.onRetry(request) : request;
				} catch (error) {
					// eslint-disable-next-line @typescript-eslint/only-throw-error
					throw new axios.Cancel(
						`Request call failed: ${String(error)}`
					);
				}
			}
		);
	}
	return cache.requestQueueInterceptorId;
}

/**
 * Ejects request queue interceptor and unset interceptor cached values.
 */
export function unsetCache({
	instance,
	cache,
}: {
	instance: AxiosInstance;
	cache: AxiosAuthRefreshCache;
}): void {
	if (cache.requestQueueInterceptorId) {
		instance.interceptors.request.eject(cache.requestQueueInterceptorId);
		cache.requestQueueInterceptorId = undefined;
	}
	cache.refreshCall = undefined;
	cache.skipInstances = cache.skipInstances.filter(
		(skipInstance) => skipInstance !== instance
	);
}

/**
 * Returns instance that's going to be used when requests are retried
 */
export function getRetryInstance({
	instance,
	options,
}: {
	instance: AxiosInstance;
	options: AxiosAuthRefreshOptions;
}): AxiosInstance {
	return options.retryInstance ?? instance;
}

/**
 * Resend failed axios request.
 */
export function resendFailedRequest({
	error,
	instance,
}: {
	error: AxiosError;
	instance: AxiosInstance;
}): AxiosPromise {
	if (error.config) {
		error.config.skipAuthRefresh = true;
	}
	return instance.request(error.response?.config ?? error.config ?? {});
}
