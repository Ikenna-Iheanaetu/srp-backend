/** @format */

import { AxiosApiError } from "@/lib/axios-instance/types";
import { runInDevOnly } from "@/lib/helper-functions/run-only-in-dev-mode";
import { PaginatedServerResponse } from "@/types/pagination";
import { StrictQueryOptions } from "@/types/tanstack-query";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@tanstack/react-table";
import { useMemo } from "react";
import {
	PaginationControls,
	PaginationControlsProps,
} from "../pagination-controls";

interface BaseProps<TData>
	extends Pick<PaginationControlsProps, "pageSizeOptions" | "siblingsCount"> {
	table: Table<TData>;
	showRowsSelection?: boolean;
	className?: string;
}

interface PropsWithoutQueryOptions<TData> extends BaseProps<TData> {
	/**Required for server-side pagination, not allowed for client-side */
	totalItems?: number;
	isFetching?: boolean;
	queryOptions?: never;
}

interface PropsWithQueryOptions<TData> extends BaseProps<TData> {
	/**
	 * This prop was introduced to solve the issue of {@link DataTableAdvanced}
	 * destructing `isFetching` flag from the query instance which is only used
	 * by this component.
	 * That way, only this component is reRendered when `isFetching` changes.
	 */
	queryOptions: StrictQueryOptions<
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		PaginatedServerResponse<any>,
		AxiosApiError,
		PaginatedServerResponse<TData>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		any
	>;
	totalItems?: never;
	isFetching?: never;
}

export type DataTablePaginationProps<TData> =
	| PropsWithoutQueryOptions<TData>
	| PropsWithQueryOptions<TData>;

export const DataTablePagination = <TData,>(
	props: DataTablePaginationProps<TData>
) => {
	const {
		table,
		showRowsSelection,
		className,
		queryOptions,
		isFetching: propsIsFetching,
		totalItems: propsTotalItems,
		...others
	} = props;

	const isPropsWithQueryOptions = !!queryOptions;

	type QueryOptions = NonNullable<typeof queryOptions>;
	type DefinedQueryOptions = {
		[K in keyof QueryOptions]: K extends "queryKey"
			? NonNullable<QueryOptions[K]>
			: QueryOptions[K];
	};

	const { isFetching: queryIsFetching, data: queryData } = useQuery({
		...((queryOptions ?? {}) as DefinedQueryOptions),
		enabled: isPropsWithQueryOptions && queryOptions.enabled,
	});

	const isFetching = isPropsWithQueryOptions
		? queryIsFetching
		: propsIsFetching;
	const totalItems = isPropsWithQueryOptions
		? queryData?.meta.total
		: propsTotalItems;

	const isServerSidePaginated = table.options.manualPagination === true;

	useMemo(
		() =>
			runInDevOnly(() => {
				if (!isServerSidePaginated) {
					// Client-side pagination: requires getPaginationRowModel
					if (!table.getPaginationRowModel) {
						throw new Error(
							"Table instance is missing pagination configuration. Ensure 'getPaginationRowModel' is provided in the table options for client-side pagination."
						);
					}
					// Client-side: totalItems should not be provided
					if (totalItems) {
						throw new Error(
							"The 'totalItems' prop is not allowed for client-side pagination. It is automatically derived from the table's filtered row model."
						);
					}
				} else {
					// Server-side pagination: requires valid pageCount and totalItems
					const pageCount =
						table.getPageCount() || table.getRowCount();
					if (pageCount === -1) {
						runInDevOnly(() =>
							console.info(
								"pageCount/rowCount = -1. Table instance might be missing pageCount/rowCount because default pageCount/rowCount is -1. Ensure 'pageCount' (or 'rowCount') is provided in the table options for manual (server-side) pagination."
							)
						);
					}
					if (!isFetching && totalItems === undefined) {
						throw new Error(
							"The 'totalItems' prop is required for server-side pagination. Provide the total number of items from the server."
						);
					}
					if (
						!isFetching &&
						(typeof totalItems !== "number" || totalItems < 0)
					) {
						throw new Error(
							"Invalid totalItems prop. Ensure 'totalItems' is a non-negative number for server-side pagination."
						);
					}
				}

				// Validate row selection configuration if rowsSelection is true
				if (showRowsSelection) {
					if (
						!table.getSelectedRowModel ||
						!table.getFilteredSelectedRowModel
					) {
						throw new Error(
							"Table instance is missing row selection configuration. Ensure 'getSelectedRowModel' and 'getFilteredSelectedRowModel' are provided in the table options when 'showRowsSelection' is true."
						);
					}
				}
			}),
		[
			isFetching,
			isServerSidePaginated,
			showRowsSelection,
			table,
			totalItems,
		]
	);

	const { pageIndex, pageSize } = table.getState().pagination;

	// Derive totalItems for client-side pagination, use provided totalItems for server-side
	const effectiveTotalItems = isServerSidePaginated
		? totalItems ?? 0
		: table.getFilteredRowModel().rows.length;

	const paginationProps = useMemo(
		() =>
			({
				...others,
				pageIndex,
				pageSize,
				totalItems: effectiveTotalItems,
				onPageIndexChange: table.setPageIndex,
				onPageSizeChange: table.setPageSize,
				isFetching: isFetching,
				className,
			} satisfies PaginationControlsProps),
		[
			className,
			effectiveTotalItems,
			isFetching,
			others,
			pageIndex,
			pageSize,
			table.setPageIndex,
			table.setPageSize,
		]
	);

	return (
		<div className="flex items-center justify-between px-4">
			{showRowsSelection && (
				<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{effectiveTotalItems} row(s) selected.
				</div>
			)}
			<PaginationControls {...paginationProps} />
		</div>
	);
};
