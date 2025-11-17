/** @format */

import { type UseQueryResult } from "@tanstack/react-query";
import React from "react";

type EmptyStateCondition<TData> = (query: UseQueryResult<TData>) => boolean;
type EmptyStateMode = "AND" | "REPLACE";

/**
 * Represents the configuration for the 'Empty' state, requiring a custom condition.
 * When using the object form for Empty, you must provide a `condition` function.
 */
interface EmptyConditionOption<TData> {
	component: React.ReactNode;
	/**
	 * A function that defines an extra condition for the 'Empty' state. This condition is required
	 * when using the object form for Empty.
	 * @param query The current UseQueryResult object.
	 * @returns boolean - True if the custom empty condition is met, false otherwise.
	 */
	condition: EmptyStateCondition<TData>;
	/**
	 * Specifies how the custom condition is used with the internal empty check.
	 * - 'AND': The custom condition is used alongside the internal check (both must be true).
	 * - 'REPLACE': The custom condition entirely replaces the internal check.
	 * @default 'AND'
	 */
	mode?: EmptyStateMode;
}

/**
 * Helper function to determine if an Empty component should be rendered based on query state and custom conditions.
 */
function getEmptyComponentIfApplicable<TData>(
	query: UseQueryResult<TData>,
	EmptyOption?: React.ReactNode | EmptyConditionOption<TData>
):
	| { shouldRender: true; component: React.ReactNode }
	| { shouldRender: false } {
	if (!EmptyOption) {
		return { shouldRender: false };
	}

	const data = query.data;
	const internalIsEmpty =
		data === undefined ||
		data === null ||
		(Array.isArray(data) && data.length === 0);

	const isEmptyConditionOption =
		typeof EmptyOption === "object" && "component" in EmptyOption;

	const emptyComponent: React.ReactNode = isEmptyConditionOption
		? EmptyOption.component
		: EmptyOption;

	if (isEmptyConditionOption) {
		const customCondition = EmptyOption.condition;
		const mode = EmptyOption.mode ?? "AND";

		const userDefinedEmpty = customCondition(query);
		const shouldShowEmpty =
			mode === "AND"
				? internalIsEmpty && userDefinedEmpty
				: // mode === "REPLACE"
					userDefinedEmpty;

		return shouldShowEmpty
			? { shouldRender: true, component: emptyComponent }
			: { shouldRender: false };
	}
	// EmptyOption = React.ReactNode
	return internalIsEmpty
		? { shouldRender: true, component: emptyComponent }
		: { shouldRender: false };
}

/**
 * Match the state of a query to a set of components.
 *
 * Useful for rendering different UI based on the state of a query.
 *
 * **Note:** if you don't provide an `Empty` component and the query is empty,
 * the data in the Success component will be also typed as undefined.
 *
 * **Note:** the `Errored` is only shown for when initial data fetch failed, processed by `!query.isSuccess && query.isError`.
 *
 * @example ```jsx
 * const query = useQuery({... });
 * return matchQueryStatus(query, {
 * Loading: <Loading />,
 * Errored: <Errored />,
 * Success: ({ data }) => <Data data={data} />
 * //           ^ type of T | null
 * })
 * ```
 * If you provide an `Empty` component, the data will be typed as non-nullable.
 * @example ```jsx
 * const query = useQuery({... });
 *
 * return matchQueryStatus(query, {
 * Loading: <Loading />,
 * Errored: <Error />,
 * Empty: <Empty />,
 * Success: ({ data }) => <Data data={data} />,
 * //           ^ type of data is T
 * );
 * ```
 * @example ```jsx
 * // Example with custom empty condition (condition is now mandatory for the object form)
 * const query = useQuery({... });
 *
 * return matchQueryStatus(query, {
 * Loading: <Loading />,
 * Errored: <Error />,
 * Empty: {
 * component: <CustomEmptyMessage />,
 * condition: (query) => query.data?.length === 0 && !query.isFetching, // condition is now mandatory
 * mode: "AND" // or "REPLACE"
 * },
 * Success: ({ data }) => <Data data={data} />,
 * );
 * ```
 */
export function matchQueryStatus<T>(
	query: UseQueryResult<T>,
	options: {
		/**Component for `query.isLoading`
		 *
		 * **Note:** When Disabling/Pausing Queries (using the queryOptions.enabled flag), this might provide unexpected behaviour. This is 
		 * because when `queryOptions.enabled = true`, then `query.isLoading` 
		 * will be false. You must handle that yourself.
		 *
		 * @See {@link https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries/}
		 *
		 * @example
		 * ```tsx
		 * // Example workaround for disabling queries
		 * const isValidRefCode = checkIsRefCodeValid(refCode);
		 * const query = useQuery({..., enabled: isValidRefCode });
		 * return isValidRefCode ? (
							matchQueryStatus(query, {
								Loading: "Loading club data...",
								Errored: "Error loading club data",
								Empty: "No club data",
								Success: (query) => query.data?.name,
							})
						) : (
							<span className="normal-case">
								Valid referral code required
							</span>
						)
		 * ```
		 */
		Loading: React.ReactNode;
		/**
		 * Component for error state. Processing: shown if `!query.isSuccess` and `query.isError`. If a function, `query.error` is passed as argument.
		 */
		Errored: React.ReactNode | ((error: unknown) => React.ReactNode);
		/**
		 * Component for empty state. Processing: internal data check (undefined/null/empty array) is used, optionally combined ('AND') or replaced ('REPLACE') by `condition` from {@link EmptyConditionOption}.
		 */
		Empty: React.ReactNode | EmptyConditionOption<T>;
		Success: (
			query: UseQueryResult<T> & {
				data: NonNullable<UseQueryResult<T>["data"]>;
			}
		) => React.ReactNode;
	}
): React.ReactNode;
export function matchQueryStatus<T>(
	query: UseQueryResult<T>,
	options: {
		Loading: React.ReactNode;
		Errored: React.ReactNode | ((error: unknown) => React.ReactNode);
		Success: (query: UseQueryResult<T>) => React.ReactNode;
	}
): React.ReactNode;
export function matchQueryStatus<T>(
	query: UseQueryResult<T>,
	{
		Loading,
		Errored,
		Empty,
		Success,
	}: {
		Loading: React.ReactNode;
		Errored: React.ReactNode | ((error: unknown) => React.ReactNode);
		Empty?: React.ReactNode | EmptyConditionOption<T>;
		Success: (query: UseQueryResult<T>) => React.ReactNode;
	}
): React.ReactNode {
	// placeholder for label
	if (query.isLoading) {
		return Loading;
	}

	if (!query.isSuccess && query.isError) {
		if (Errored instanceof Function) {
			return Errored(query.error);
		}
		return Errored;
	}

	const emptyValue = getEmptyComponentIfApplicable(query, Empty);
	if (emptyValue.shouldRender) {
		return emptyValue.component;
	}

	return Success(query);
}
