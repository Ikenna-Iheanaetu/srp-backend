/** @format */

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { href, Link } from "react-router";

interface DataTableProps<TData, TValue> {
	title?: string;
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export const DataTable = <TData, TValue>({
	title,
	columns,
	data,
}: DataTableProps<TData, TValue>) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onGlobalFilterChange: setGlobalFilter,
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: "includesString",
		state: {
			sorting,
			globalFilter,
		},
	});

	return (
		<div>
			<div className="flex justify-between items-center gap-4 py-4">
				<Input
					placeholder="Search table data..."
					value={globalFilter}
					onChange={(e) => table.setGlobalFilter(e.target.value)}
					className="max-w-sm"
				/>

				<Button
					type="button"
					title="Export table data"
					className="button !bg-white px-10 border border-gray-200">
					Export
				</Button>
			</div>

			<div className="rounded-md rounded-es-none rounded-ee-none border">
				<Table>
					<TableCaption className="caption-top text-left text-base font-semibold text-black mt-0 p-4">
						{title ?? "New Applicants"}
					</TableCaption>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="bg-gray-100">
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
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && "selected"
									}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex justify-end py-2 px-4 border border-t-0 rounded-es-md rounded-ee-md">
				<Link
					to={href("/job-management/posted")}
					className="text-blue-700 font-semibold">
					See all
				</Link>
			</div>
		</div>
	);
};
