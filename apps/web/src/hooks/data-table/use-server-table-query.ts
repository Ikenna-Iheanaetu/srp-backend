/**
 * eslint-disable @typescript-eslint/no-unused-vars
 *
 * @format
 */

/** @format */

import { DataTableAdvancedProps } from "@/components/common/data-table/data-table";
import { useDataTableFilters } from "@/components/data-table-filter";
import {
	ColumnConfig,
	ColumnDataType,
} from "@/components/data-table-filter/core/types";
import { handleTablePaginationChange } from "@/hooks/use-pagination";
import { PaginatedServerResponse } from "@/types/pagination";
import { StrictQueryOptions } from "@/types/tanstack-query";
import {
	BazzaQueryFilters,
	TableQueryFiltersFromColumns,
} from "@/types/tanstack-table";
import {
	keepPreviousData,
	QueryKey,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	ColumnDef,
	getCoreRowModel,
	TableOptions,
	TableState,
	useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useURLTableQueryParams } from "./use-url-table-query-params";
import { AxiosApiError } from "@/lib/axios-instance/types";

interface TableConfigOptions<TData>
	extends SafeOmit<
		TableOptions<TData>,
		| "data"
		| "columns"
		| "manualPagination"
		| "pageCount"
		| "onPaginationChange"
		| "getCoreRowModel"
	> {
	state?: SafeOmit<Partial<TableState>, "pagination">;
}

/** Query options callback, static or dynamic based on filters.
 * @param U should be of type {@link ColumnConfig}[]
 */
type QueryOptionsCallback<T, U> = (
	initialParams: TableQueryFiltersFromColumns<U>
) => T;

interface ServerTableQueryOptions<
	FnPData,
	PData,
	TFiltersColumnConfig extends readonly ColumnConfig<
		PData,
		ColumnDataType,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		any,
		string
	>[],
	TQueryKey extends QueryKey = QueryKey
> {
	/**A function when called with the query params, return the queryOptions
	 * object.
	 */
	getQueryOptions: TableQueryFiltersFromColumns<TFiltersColumnConfig> extends TQueryKey[number]
		? QueryOptionsCallback<
				StrictQueryOptions<
					PaginatedServerResponse<FnPData>,
					AxiosApiError,
					PaginatedServerResponse<PData>,
					TQueryKey
				>,
				TFiltersColumnConfig
		  >
		: never;
	filterColumnsConfig?: TFiltersColumnConfig;
	tableColumnsDef: ColumnDef<PData>[];
	/**Options passed to the {@link useReactTable} hook */
	tableConfigOptions?: TableConfigOptions<PData>;
}

/**
 * React hook for server-side paginated and filtered tables.
 * Integrates URL filters, Tanstack Table, and Tanstack Query for data fetching, pagination, and filtering.
 *
 * Designed for {@link DataTableAdvanced}.
 *
 * **NOTE**: The returned object is not referentially stable; do not use in any React hook dependencies array. Use destructured properties instead.
 *
 * * Designed for {@link DataTableAdvanced}.
 *
 * **NOTE**: The returned object is not referentially stable; do not use in any React hook dependencies array. Use destructured properties instead.
 *
 * @example
 * ```tsx
 * import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
 * import { affiliateManagementQueries } from "./query-factory";
 * import { columns, affiliatesFiltersConfig } from "./columns"
 *
 * const { dataTableAdvancedProps } = useServerTableQuery({
 *   queryOptions: affiliateManagementQueries.affiliates,
 * 	 filterColumnsConfig: affiliatesFiltersConfig, // optional
 *   tableColumnsDef: columns,
 * });
 *
 * return (
 *   <DataTableAdvanced {...dataTableAdvancedProps} />
 * );
 * ```
 */
export const useServerTableQuery = <
	FnPData,
	PData,
	TFiltersColumnConfig extends readonly ColumnConfig<
		PData,
		ColumnDataType,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		any,
		string
	>[],
	TQueryKey extends QueryKey = QueryKey
>({
	getQueryOptions,
	filterColumnsConfig,
	tableColumnsDef,
	tableConfigOptions = {},
}: ServerTableQueryOptions<
	FnPData,
	PData,
	TFiltersColumnConfig,
	TQueryKey
>) => {
	const { filtersFromSearchParams, pagination, queryParams } =
		useURLTableQueryParams<BazzaQueryFilters<TFiltersColumnConfig>>();

	const { filters, setFilters } = filtersFromSearchParams;

	const {
		pageSize,
		pageIndex,
		setPageIndex,
		setPageSize,
		updateFromServerMeta,
		getCanNextPage,
	} = pagination;

	const paginationState = useMemo(
		() => ({ pageIndex, pageSize }),
		[pageIndex, pageSize]
	);

	const queryOptions = useMemo(
		() => ({
			...getQueryOptions(queryParams),
			placeholderData: keepPreviousData,
		}),
		[getQueryOptions, queryParams]
	);

	const query = useQuery(queryOptions);
	const { data } = query;

	const serverPaginationMeta = data?.meta;

	const queryClient = useQueryClient();

	const prevMetaRef = useRef(serverPaginationMeta ?? null);

	const shouldUpdateClientPagination = useCallback((): boolean => {
		if (!!data || !serverPaginationMeta) {
			return false;
		}

		const hasClientServerPageMismatch =
			serverPaginationMeta.page !== pageIndex + 1;
		const hasClientServerLimitMismatch =
			serverPaginationMeta.limit !== pageSize;

		const serverMetaMatchesQueryParams =
			serverPaginationMeta.page === queryParams.page &&
			serverPaginationMeta.limit === queryParams.limit;

		return (
			(hasClientServerPageMismatch || hasClientServerLimitMismatch) &&
			serverMetaMatchesQueryParams
		); // this logic allows for client-side optimistic pagination updates
	}, [
		data,
		pageIndex,
		pageSize,
		queryParams.limit,
		queryParams.page,
		serverPaginationMeta,
	]);

	useEffect(() => {
		if (serverPaginationMeta && shouldUpdateClientPagination()) {
			prevMetaRef.current = serverPaginationMeta;

			updateFromServerMeta(serverPaginationMeta);
		}
	}, [
		serverPaginationMeta,
		shouldUpdateClientPagination,
		updateFromServerMeta,
	]);

	useEffect(() => {
		// as long as query params object changed, prefetch the next page
		if (getCanNextPage()) {
			const newQueryOptions = getQueryOptions({
				...queryParams,
				page: (queryParams.page ?? 0) + 1,
			});
			void queryClient.prefetchQuery(newQueryOptions);
		}
	}, [getQueryOptions, getCanNextPage, queryClient, queryParams]);

	const filtersOptions = useDataTableFilters({
		strategy: "server",
		data: data?.data ?? [],
		columnsConfig: filterColumnsConfig ?? [],
		controlledState: [filters, setFilters],
	});

	const { state: externalTableState, ...tableOptions } = tableConfigOptions;

	const table = useReactTable({
		...tableOptions,
		data: data?.data ?? [],
		columns: tableColumnsDef,
		manualPagination: true,
		pageCount: data?.meta.totalPages ?? -1,
		onPaginationChange: (updater) =>
			handleTablePaginationChange({
				updater,
				prevState: paginationState,
				setPageIndex,
				setPageSize,
			}),
		getCoreRowModel: getCoreRowModel(),
		state: {
			...externalTableState,
			pagination: paginationState,
		},
	});

	/**
	 * Props for {@link DataTableAdvanced}.
	 * Spread into <DataTableAdvanced /> for convenience and type safety.
	 *
	 * @example
	 * ```tsx
	 *   <DataTableAdvanced {...dataTableAdvancedProps} />
	 * ```
	 *
	 * **NOTE**: Not referentially stable; do not use in any React hook
	 * dependencies array.
	 */
	const dataTableAdvancedProps = {
		queryOptions,
		table,
		toolbar: {
			filters: filtersOptions,
			search: {
				value: filtersFromSearchParams.search,
				onChange: (value) =>
					void filtersFromSearchParams.setSearch(value),
			},
		},
	} satisfies DataTableAdvancedProps<PData>;

	return {
		table,
		queryOptions,
		filtersOptions,
		pagination,
		filtersFromSearchParams,
		dataTableAdvancedProps,
	};
};
