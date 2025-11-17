/** @format */

import {
	DataTable,
	DataTableRow,
} from "@/components/common/data-table/data-table";
import { DataTableFiltersToolbar } from "@/components/common/data-table/filters-toolbar";
import { DataTablePagination } from "@/components/common/data-table/pagination";
import { TableSkeleton } from "@/components/common/data-table/table-skeleton";
import { useURLTableQueryParams } from "@/hooks/data-table/use-url-table-query-params";
import { handleTablePaginationChange } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useEffect } from "react";
import { hiredJobsQueries } from "../../query-factory";
import { columns } from "./columns";

export function HiredJobsDataTable() {
	const {
		pagination,
		queryParams,
		filtersFromSearchParams,
	} = // eslint-disable-next-line @typescript-eslint/no-empty-object-type
		useURLTableQueryParams<{}>();
	const {
		pageSize,
		setPageSize,
		pageIndex,
		setPageIndex,
		updateFromServerMeta,
	} = pagination;

	const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
		...hiredJobsQueries.jobs(queryParams),
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		if (data?.meta) {
			updateFromServerMeta(data.meta);
		}
	}, [data?.meta, updateFromServerMeta]);

	const table = useReactTable({
		data: data?.data ?? [],
		columns,
		manualPagination: true,
		pageCount: data?.meta.totalPages ?? -1,
		getCoreRowModel: getCoreRowModel(),
		state: {
			pagination,
		},
		onPaginationChange: (updater) =>
			handleTablePaginationChange({
				updater,
				setPageIndex,
				setPageSize,
				prevState: { pageIndex, pageSize },
			}),
	});

	return isLoading ? (
		<TableSkeleton />
	) : (
		<div className="space-y-4">
			<DataTableFiltersToolbar
				search={{
					value: filtersFromSearchParams.search,
					onChange: (value) =>
						void filtersFromSearchParams.setSearch(value),
				}}
			/>
			<DataTable
				table={table}
				renderRow={(row) => <DataTableRow row={row} />}
				emptyMessage="No results"
				className={cn(
					isFetching && isPlaceholderData && "animate-pulse"
				)}
			/>

			<DataTablePagination
				totalItems={data?.meta.total ?? 0}
				table={table}
			/>
		</div>
	);
}
