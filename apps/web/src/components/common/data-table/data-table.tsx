/** @format */

import {
	Cell,
	flexRender,
	Row,
	Table as TableInstance,
} from "@tanstack/react-table";

import {
	DataTablePagination,
	DataTablePaginationProps,
} from "@/components/common/data-table/pagination";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { AxiosApiError } from "@/lib/axios-instance/types";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { cn } from "@/lib/utils";
import { PaginatedServerResponse } from "@/types/pagination";
import { StrictQueryOptions } from "@/types/tanstack-query";
import { useQuery } from "@tanstack/react-query";
import React, { JSX } from "react";
import {
	DataTableFiltersToolbar,
	DataTableFiltersToolbarProps,
} from "./filters-toolbar";
import { TableSkeleton } from "./table-skeleton";

interface DataTableCellProps<TData, TValue>
	extends SafeOmit<
		React.HtmlHTMLAttributes<HTMLTableCellElement>,
		"children"
	> {
	cell: Cell<TData, TValue>;
}

/**For use under rows inside `<TableBody>` in a Data Table*/
const DataTableCell = <TData, TValue>({
	cell,
	...props
}: DataTableCellProps<TData, TValue>) => {
	return (
		<TableCell {...props}>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</TableCell>
	);
};

type TableCellEmptyProps = RequireKeys<
	React.ComponentProps<typeof TableCell>,
	"children" | "colSpan"
>;

const TableCellEmpty: React.FC<TableCellEmptyProps> = ({
	className,
	...props
}) => <TableCell {...props} className={cn("h-24 text-center", className)} />;

interface DataTableRowProps<TData>
	extends SafeOmit<
		React.HtmlHTMLAttributes<HTMLTableRowElement>,
		"children"
	> {
	row: Row<TData>;
}

/**For use under `<TableBody>` in a Data Table*/
const DataTableRow = <TData,>({ row, ...props }: DataTableRowProps<TData>) => {
	return (
		<TableRow {...props} data-state={row.getIsSelected() && "selected"}>
			{row.getVisibleCells().map((cell) => (
				<DataTableCell key={cell.id} cell={cell} />
			))}
		</TableRow>
	);
};

interface DataTableProps<TData> {
	table: TableInstance<TData>;
	/**
	 * **NOTE**: Make sure this function is a stable reference to avoid
	 * heavy rerenders.
	 *
	 * Callback to customize rendering of each data row under TableBody when
	 * data is present.
	 */
	renderRow?: (row: Row<TData>, index?: number) => JSX.Element;
	/**Optional message to display when there are no rows in the table */
	emptyMessage?: React.ReactNode;
	className?: string;
}

/**Simple Data Table component primarily for rendering the html `<table>` structure, using the table instance from React Table
 */
function DataTable<TData>({
	table,
	renderRow,
	emptyMessage = "No results.",
	className,
}: DataTableProps<TData>) {
	return (
		<div className={cn("rounded-md border grid grid-cols-1", className)}>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef
														.header,
													header.getContext()
											  )}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row, index) =>
							renderRow ? (
								// explicitly add key in case render function doesn't
								<React.Fragment key={row.id}>
									{renderRow(row, index)}
								</React.Fragment>
							) : (
								<DataTableRow key={row.id} row={row} />
							)
						)
					) : (
						<TableRow>
							<TableCellEmpty
								colSpan={table.getAllColumns().length}>
								{emptyMessage}
							</TableCellEmpty>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}

interface DataTableAdvancedProps<TData> extends DataTableProps<TData> {
	queryOptions: StrictQueryOptions<
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		PaginatedServerResponse<any>,
		AxiosApiError,
		PaginatedServerResponse<TData>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		any
	>;
	toolbar: RequireKeys<DataTableFiltersToolbarProps<TData>, "search">;
	pagination?: /* Omitting props we already have */ SafeOmit<
		DataTablePaginationProps<TData>,
		"isFetching" | "table" | "totalItems" | "queryOptions"
	>;
}

/**
 * A advanced data table component that handles loading states and includes toolbar, pagination, and filtering capabilities
 *
 * @example
 * <DataTableAdvanced
 *   queryOptions={queryOptions}
 *   toolbar={toolbarProps}
 *   pagination={paginationProps}
 *   className="py-4"
 * />
 */
const DataTableAdvanced = <TData,>({
	queryOptions,
	toolbar,
	pagination,
	className,
	emptyMessage = "No results.",
	table,
	renderRow,
}: DataTableAdvancedProps<TData>) => {
	const { isLoading, isPlaceholderData, error, isSuccess, refetch } =
		useQuery(queryOptions);
	if (isLoading) {
		return <TableSkeleton />;
	}

	const isInitialError = !isSuccess && !!error;

	return (
		<div className={cn("space-y-4", className)}>
			<DataTableFiltersToolbar {...toolbar} />
			<DataTable
				table={table}
				emptyMessage={
					isInitialError ? (
						// Note that this done with the assumption that
						// an empty array fallback is provided to the
						// tableOptions.data, when there's no data from the query
						<p className="text-red-500 text-left">
							Error occurred fetching table data:{" "}
							{getApiErrorMessage(error)}
							<br />
							<Button
								onClick={() => void refetch()}
								variant={"ghost"}
								className="text-blue-700">
								Retry
							</Button>
						</p>
					) : (
						emptyMessage
					)
				}
				renderRow={renderRow}
				className={cn(isPlaceholderData && "animate-pulse")}
			/>
			<DataTablePagination
				{...pagination}
				table={table}
				queryOptions={queryOptions}
			/>
		</div>
	);
};

export {
	DataTable,
	DataTableAdvanced,
	DataTableCell,
	DataTableRow,
	/**@deprecated Use {@link DataTable} export instead. */
	DataTable as DataTableSimple,
	TableCellEmpty,
};

export type {
	DataTableAdvancedProps,
	DataTableCellProps,
	DataTableProps,
	DataTableRowProps,
	TableCellEmptyProps,
};
