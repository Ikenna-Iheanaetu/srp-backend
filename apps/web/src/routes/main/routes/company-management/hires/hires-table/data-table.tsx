/** @format */

import { DataTablePagination } from "@/components/common/data-table/pagination";
import { TableRowIsLoading } from "@/components/common/data-table/table-row-is-loading";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	handleTablePaginationChange,
	usePagination,
} from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { href, useNavigate, useParams } from "react-router";
import { EntityRequestParams } from "../../../entity/query-factory";
import { companyManagementQueries } from "../../query-factory";
import { columns } from "./columns";

export function CompaniesDataTable() {
	const {
		pageSize,
		setPageSize,
		pageIndex,
		setPageIndex,
		updateFromServerMeta,
	} = usePagination();

	const { id: companyId } = useParams();
	const query = useQuery({
		...companyManagementQueries.companyHires({
			page: pageIndex + 1,
			limit: pageSize,
			companyId: companyId!,
		}),
		placeholderData: keepPreviousData,
	});
	const { data, isLoading, isFetching } = query;

	useEffect(() => {
		if (data?.meta) {
			updateFromServerMeta(data.meta);
		}
	}, [data?.meta, updateFromServerMeta]);

	const navigate = useNavigate();
	const handleViewProfile = (params: EntityRequestParams) => {
		void navigate(href("/:userType/:id", params));
	};

	const tableColumns = columns({
		onViewProfile: handleViewProfile,
	});

	const [globalFilter, setGlobalFilter] = useState("");

	const table = useReactTable({
		data: data?.data ?? [],
		columns: tableColumns,
		manualPagination: true,
		pageCount: data?.meta.totalPages ?? -1,
		getCoreRowModel: getCoreRowModel(),
		onGlobalFilterChange: setGlobalFilter,
		state: {
			pagination: { pageIndex, pageSize },
			globalFilter,
		},
		onPaginationChange: (updater) =>
			handleTablePaginationChange({
				updater,
				setPageIndex,
				setPageSize,
				prevState: { pageIndex, pageSize },
			}),
	});

	const cellStyles = "px-6";

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col items-center justify-start gap-8 *:w-full sm:flex-row sm:*:w-auto">
				<h2 className="text-sm font-semibold capitalize">
					Company hired
				</h2>
				<div className="grid flex-1 grid-cols-1 gap-4 *:w-full sm:grid-cols-2 sm:*:w-auto">
					<Input
						value={globalFilter}
						onChange={(e) =>
							table.setGlobalFilter(String(e.target.value))
						}
						placeholder="Search..."
					/>
				</div>
			</div>
			<div className="rounded-md border">
				<Table className="caption-top">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className={cn(cellStyles)}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef
														.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading && !data ? (
							<TableRowIsLoading
								columnsLength={tableColumns.length}
							/>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									onDoubleClick={() =>
										handleViewProfile({
											id: row.original.id,
											userType:
												row.original.affiliateType,
										})
									}>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cn(cellStyles)}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={tableColumns.length}
									className="h-24 text-center">
									No hired
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination
				totalItems={data?.meta.total ?? 0}
				isFetching={isFetching}
				table={table}
			/>
		</div>
	);
}
