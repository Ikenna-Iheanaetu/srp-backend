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
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCoreRowModel, Row, useReactTable } from "@tanstack/react-table";
import { useEffect } from "react";
import { href, useNavigate, useParams } from "react-router";
import { shortlistedJobsQueries } from "../../query-factory";
import { columns, ShortlistedCandidate } from "./columns";

export function ShortlistedCandidatesDataTable() {
	const { id: jobId } = useParams<{ id: string }>();

	const { pagination, queryParams, filtersFromSearchParams } =
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		useURLTableQueryParams<{}>();

	const {
		pageSize,
		pageIndex,
		setPageSize,
		setPageIndex,
		updateFromServerMeta,
	} = pagination;

	const { data, isFetching, isPlaceholderData, isLoading } = useQuery({
		...shortlistedJobsQueries.candidates({
			...queryParams,
			jobId: jobId ?? "",
		}),
		enabled: !!jobId,
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		if (data?.meta) {
			updateFromServerMeta(data.meta);
		}
	}, [data?.meta, updateFromServerMeta]);

	const navigate = useNavigate();
	const handleViewProfile = (row: Row<ShortlistedCandidate>) => {
		const profilePath = href("/:userType/:id", {
			id: row.original.id,
			userType: row.original.userType.toLowerCase(),
		});
		void navigate(profilePath, {
			state: {
				crumbs: [
					{
						label: "Shortlisted candidates",
						path: href("/recruiting/shortlisted/:id", {
							id: jobId!,
						}),
					},
					{
						label: row.original.name,
						path: profilePath,
					},
				],
			} satisfies CrumbsLocationState,
		});
	};

	const tableColumns = columns({
		onViewProfile: handleViewProfile,
	});

	const table = useReactTable({
		data: data?.data ?? [],
		columns: tableColumns,
		manualPagination: true,
		pageCount: data?.meta.totalPages ?? -1,
		getCoreRowModel: getCoreRowModel(),
		state: {
			pagination,
		},
		onPaginationChange: (updater) =>
			handleTablePaginationChange({
				updater,
				prevState: { pageIndex, pageSize },
				setPageIndex,
				setPageSize,
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
				renderRow={(row) => (
					<DataTableRow
						row={row}
						onDoubleClick={() => handleViewProfile(row)}
					/>
				)}
				emptyMessage="No results"
				className={cn(
					isFetching && isPlaceholderData && "animate-pulse",
				)}
			/>

			<DataTablePagination
				totalItems={data?.meta.total ?? 0}
				table={table}
			/>
		</div>
	);
}
