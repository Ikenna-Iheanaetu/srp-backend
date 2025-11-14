/** @format */

import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	getPaginationRowModel,
} from "@tanstack/react-table";
import { DataTableSimple } from "@/components/common/data-table/data-table";
import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronDown } from "lucide-react";
import { newCompaniesColumns } from "./columns";
import { NewCompanyItem } from "../../query-factory";

interface NewCompaniesTableProps {
	data: NewCompanyItem[];
}

export const NewCompaniesTable: FC<NewCompaniesTableProps> = ({ data }) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 5,
	});

	const table = useReactTable({
		data,
		columns: newCompaniesColumns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onGlobalFilterChange: setGlobalFilter,
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: "includesString",
		onPaginationChange: setPagination,
		state: {
			sorting,
			globalFilter,
			pagination,
		},
	});

	const pageCount = table.getPageCount();
	const currentPage = table.getState().pagination.pageIndex + 1;

	const handleExport = (format: string) => {
		console.log(`Exporting as ${format}`);
		// TODO: Implement actual export functionality
	};

	return (
		<div className="space-y-4 bg-white rounded-lg p-4 md:p-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h2 className="text-lg md:text-xl font-semibold">New Companies</h2>

				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
					<div className="relative w-full sm:w-auto">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search by Date or Name ..."
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className="pl-10 w-full sm:w-[300px]"
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="gap-2 w-1/2 sm:w-auto">
								Export
								<ChevronDown className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => handleExport('pdf')}>
								PDF
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleExport('csv')}>
								CSV
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleExport('xlsx')}>
								XLSX
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="overflow-x-auto">
				<DataTableSimple table={table} className="border border-gray-200 shadow-lg rounded-lg" />
			</div>

			{/* Pagination and Info */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
				{/* Pagination - Left side */}
				<div className="flex items-center gap-2 md:gap-6">
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 border-[1px] border-gray-200"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						&lt;
					</Button>

					{Array.from({ length: Math.min(pageCount, 3) }, (_, i) => i).map((i) => (
						<Button
							key={i}
							variant="ghost"
							size="sm"
							onClick={() => table.setPageIndex(i)}
							className={`h-8 w-8 p-0 ${
								currentPage === i + 1
									? "bg-[#FAFAFA] text-[#313335]"
									: ""
							}`}>
							{i + 1}
						</Button>
					))}

					{pageCount > 4 && <span className="px-2 text-gray-600">...</span>}

					{pageCount > 3 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => table.setPageIndex(pageCount - 1)}
							className={`h-8 w-8 p-0 ${
								currentPage === pageCount
									? "bg-[#FAFAFA] text-[#313335]"
									: ""
							}`}>
							{pageCount}
						</Button>
					)}

					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 border-[1px] border-[#F4F4F5]"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}>
						&gt;
					</Button>
				</div>

				{/* Showing info and See All - Right side */}
				<div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs md:text-sm text-[#696E72]">
					<span className="text-center sm:text-left">
						Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
						{Math.min(
							(table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
							table.getFilteredRowModel().rows.length
						)}{" "}
						of {table.getFilteredRowModel().rows.length} entries
					</span>
					<Button variant="link" className="text-[#4D7C0F] border-[1px] border-[#ECFCCB] p-2 w-full sm:w-auto">
					See All
					</Button>
				</div>
			</div>
		</div>
	);
};
