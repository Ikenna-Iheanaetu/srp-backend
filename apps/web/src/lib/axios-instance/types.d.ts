/** @format */

import type { AxiosError } from "axios";

interface BaseApiResponse {
	success: boolean;
	message: string;
}

type DataGeneric =
	| {
			hasData: false;
			data?: never;
	  }
	| {
			hasData?: true;
			data: unknown;
	  };

export type ApiSuccessResponse<
	TDataGeneric extends DataGeneric = { hasData: false },
> = Prettify<
	(BaseApiResponse & { success: true }) &
		(TDataGeneric["hasData"] extends false
			? {
					data?: never;
			  }
			: {
					data: TDataGeneric["data"];
			  })
>;

export interface ApiErrorResponse extends BaseApiResponse {
	success: false;
	errors: unknown[];
}

/**Type for API errors, extending AxiosError with our custom error shape */
export type AxiosApiError<
	T extends ApiErrorResponse = ApiErrorResponse,
	D = unknown,
> = RequireKeys<AxiosError<T, D>, "response">;

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

export type AuthorizationBearer = `Bearer ${string}`;

/**
 * Extends the axios module with custom configuration options.
 * These options allow fine-grained control over request behavior.
 */
declare module "axios" {
	interface AxiosRequestConfig {
		/** Skip adding auth token to request headers */
		skipAuthHeader?: boolean;
		/** Skip the token refresh logic for this request. */
		skipAuthRefresh?: boolean;
		/** Skip prefixing URL with user type */
		skipUserTypePrefix?: boolean;
	}
}
/** @format */

import type { AxiosError } from "axios";

interface BaseApiResponse {
	success: boolean;
	message: string;
}

type DataGeneric =
	| {
			hasData: false;
			data?: never;
	  }
	| {
			hasData?: true;
			data: unknown;
	  };
type ApiSuccessResponse<TDataGeneric extends DataGeneric = { hasData: false }> =
	Prettify<
		(BaseApiResponse & { success: true }) &
			(TDataGeneric["hasData"] extends false
				? {
						data?: never;
					}
				: {
						data: TDataGeneric["data"];
					})
	>;

interface ApiErrorResponse extends BaseApiResponse {
	success: false;
	errors: unknown[];
}

/**Type for API errors, extending AxiosError with our custom error shape */
type AxiosApiError<
	T extends ApiErrorResponse = ApiErrorResponse,
	D = unknown,
> = RequireKeys<AxiosError<T, D>, "response">;

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

type AuthorizationBearer = `Bearer ${string}`;

/**
 * Extends the axios module with custom configuration options.
 * These options allow fine-grained control over request behavior.
 */
declare module "axios" {
	interface AxiosRequestConfig {
		/** Skip adding auth token to request headers */
		skipAuthHeader?: boolean;
		/** Skip the token refresh logic for this request. */
		skipAuthRefresh?: boolean;
		/** Skip prefixing URL with user type */
		skipUserTypePrefix?: boolean;
	}
}
