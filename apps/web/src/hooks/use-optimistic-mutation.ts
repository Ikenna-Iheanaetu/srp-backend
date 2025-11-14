/** @format */

import { AxiosApiError } from "@/lib/axios-instance/types";
import { SafeOmit } from "@/types";
import {
	QueryKey,
	queryOptions,
	useMutation,
	UseMutationOptions,
	useQueryClient,
} from "@tanstack/react-query";
import React from "react";

type TypeSafeQueryKey<TQueryFnData> = ReturnType<
	typeof queryOptions<TQueryFnData>
>["queryKey"];

interface OptimisticProps<
	TData = unknown,
	TError = AxiosApiError,
	TVariables = void,
	TQueryFnData = unknown
> extends SafeOmit<
		UseMutationOptions<TData, TError, TVariables, () => void>,
		"onError" | "onMutate" | "onSettled"
	> {
	/**
	 * @note The mutation context is omitted in the params because rollback of data snapshot is done automatically on error.
	 */
	onError?: (error: TError, variables: TVariables) => void;
	/**
	 * The `queryKey` of the cache to update optimistically.
	 *
	 * The type of this `queryKey` expects you defined it using the `queryOptions` helper, cause it adds the `dataTag` symbols. Otherwise TypeScript will error */
	queryKey: TypeSafeQueryKey<TQueryFnData>;
	/**Function that updates the query cache optimistically */
	updater: (
		input: TQueryFnData | undefined,
		variables: TVariables
	) => TQueryFnData | undefined;
	/**Query keys to invalidate after mutation settles */
	invalidates?: QueryKey;
}

/**
 * A custom hook wrapper on `useMutation` for handling optimistic mutations with React Query.
 *
 * @note The `queryKey` is added to the `mutationKey` internally, to invalidate `onSuccess` through the `mutationCache.onSuccess`.
 *
 * @example
 * ```typescript
 * const mutation = useOptimisticMutation({
 *   queryKey: ['todos'],
 *   updater: (old) => [...old, newTodo],
 *   invalidates: ['todos']
 * });
 * ```
 */
export const useOptimisticMutation = <
	TData = unknown,
	TError = AxiosApiError,
	TVariables = void,
	TQueryFnData = unknown
>({
	queryKey,
	updater,
	invalidates,
	onError,
	mutationKey: externalMutationKey,
	...props
}: OptimisticProps<TData, TError, TVariables, TQueryFnData>) => {
	const queryClient = useQueryClient();

	// Generates a unique ID once per hook instance.
	// This is vital to prevent mutation state (e.g., isPending, data, error)
	// collisions when multiple useOptimisticMutation calls share the same `queryKey`.
	const uniqueMutationIdRef = React.useRef<string>(null);
	if (uniqueMutationIdRef.current === null) {
		uniqueMutationIdRef.current = crypto.randomUUID();
	}

	const mutationKey = React.useMemo(
		() =>
			// Ensures a unique mutationKey for each hook instance.
			// If no externalMutationKey is provided, the unique ID is appended.
			[
				...queryKey,
				...(externalMutationKey ?? [uniqueMutationIdRef.current]),
			],
		[externalMutationKey, queryKey]
	);

	return useMutation({
		...props,
		mutationKey,
		onMutate: async (variables) => {
			await queryClient.cancelQueries({
				queryKey,
			});

			const snapshot = queryClient.getQueryData(queryKey);

			queryClient.setQueryData(queryKey, (old) =>
				updater(old, variables)
			);

			return () => {
				queryClient.setQueryData(queryKey, snapshot);
			};
		},
		onError: (err, variables, rollback) => {
			rollback?.();
			onError?.(err, variables);
		},
		onSettled: () => {
			return queryClient.invalidateQueries({
				queryKey: invalidates,
			});
		},
	});
};
