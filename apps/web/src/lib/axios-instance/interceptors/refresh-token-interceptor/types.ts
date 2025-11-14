/** @format */

import {
	AxiosError,
	AxiosInstance,
	AxiosRequestConfig,
	InternalAxiosRequestConfig,
} from "axios";

export interface AxiosAuthRefreshOptions {
	statusCodes?: number[];
	/**
	 * Determine whether to refresh, if "shouldRefresh" is configured, The "statusCodes" logic will be ignored
	 * @param error AxiosError
	 * @returns boolean
	 */
	shouldRefresh?(error: AxiosError): boolean;
	retryInstance?: AxiosInstance;
	interceptNetworkError?: boolean;
	pauseInstanceWhileRefreshing?: boolean;
	onRetry?: (
		requestConfig: InternalAxiosRequestConfig
	) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
}

export interface AxiosAuthRefreshCache {
	skipInstances: AxiosInstance[];
	refreshCall: Promise<unknown> | undefined;
	requestQueueInterceptorId: number | undefined;
}

export interface AxiosAuthRefreshRequestConfig extends AxiosRequestConfig {
	skipAuthRefresh?: boolean;
}
