/** @format */

import { ApiError } from "@/lib/axios-instance/api-error-signal";
import "@tanstack/react-query";
import { QueryCache, queryOptions } from "@tanstack/react-query";
import { AutocompleteString } from ".";
import { AxiosApiError } from "@/lib/axios-instance/types";

type QueryCacheConfig = NonNullable<
	ConstructorParameters<typeof QueryCache>[number]
>;

interface QueryMeta
	extends Record<string, unknown>,
		Pick<QueryCacheConfig, "onSuccess"> {
	/**
	 * Controls default toast notifications on query error, processed by `queryCache.onError`.
	 *
	 * - If this function is not passed or returns nothing (void/undefined), a default toast notification is shown for all the query's errors.
	 * - If this function returns a string (excluding "none"), that string will be used as the title for the default toast notification.
	 * - If this function returns "none", no default toast notification will be shown.
	 * - **Tip:** Returning "none" can be handy when you want to control the toast notifications entirely yourself.
	 */
	onError?: (
		...args: Parameters<QueryCacheConfig["onError"]>
	) => AutocompleteString<"none"> | void;
}

interface MutationMeta extends Record<string, unknown> {
	/**
	 * Controls default toast notifications on mutation error, processed by `mutationCache.onError`.
	 *
	 * - If this is not passed or undefined, a default toast notification is shown for all the mutation's errors.
	 * - If this is a string (excluding ""none""), that string will be used as the title for the default toast notification.
	 * - If this is "none", no default toast notification will be shown.
	 * - **Tip:** Setting this to "none" disables the default toast from `mutationCache.onError`. This is useful if you are handling toasts manually using the `onError` callback on {@link useMutation} options.
	 */
	errorMessage?: AutocompleteString<"none">;
}

declare module "@tanstack/react-query" {
	interface Register {
		defaultError: AxiosApiError;
		queryMeta: QueryMeta;
		mutationMeta: MutationMeta;
	}
}

/**
 * A more type-safe version of {@link UseQueryOptions} that enforces the use
 * of the {@link queryOptions} helper.
 */
type StrictQueryOptions<
	TQueryFnData = unknown,
	TError = ApiError,
	TData = TQueryFnData,
	TQueryKey extends QueryKey = readonly unknown[],
> = ReturnType<typeof queryOptions<TQueryFnData, TError, TData, TQueryKey>>;
