/** @format */

import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	getPaginationRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/data-table";
import { DataTablePagination } from "@/components/common/data-table/pagination";
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
import { createHireHistoryColumns } from "./columns";
import { HireHistoryItem } from "../../query-factory";
import { HireHistoryDetailsSheet } from "./hire-history-details-sheet";
import { EmptyState } from "../../../../revenue-management/club/components/empty-state";

interface HireHistoryTableProps {
	data: HireHistoryItem[];
}

export const HireHistoryTable: FC<HireHistoryTableProps> = ({ data }) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [selectedItem, setSelectedItem] = useState<HireHistoryItem | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const handleViewDetails = (item: HireHistoryItem) => {
		setSelectedItem(item);
		setIsSheetOpen(true);
	};

	const handleExport = (format: string) => {
		console.log(`Exporting as ${format}`);
		// TODO: Implement actual export functionality
	};

	const columns = createHireHistoryColumns(handleViewDetails);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onGlobalFilterChange: setGlobalFilter,
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: "includesString",
		initialState: {
			pagination: {
				pageSize: 5,
			},
		},
		state: {
			sorting,
			globalFilter,
		},
	});

	return (
		<div className="space-y-4 bg-white rounded-lg p-4 md:p-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h2 className="text-lg md:text-xl font-semibold">Hire History</h2>

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
							<DropdownMenuItem onClick={() => handleExport("pdf")}>
								PDF
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleExport("csv")}>
								CSV
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleExport("xlsx")}>
								XLSX
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Show empty state if no data */}
			{data.length === 0 ? (
				<EmptyState
					title="No Hire History Found"
					description="No hire transactions have been recorded yet"
				/>
			) : (
				<>
					<DataTable
						table={table}
						className="border border-[#F1F5F9] shadow-lg rounded-lg"
					/>

					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
						<div className="text-xs md:text-sm text-[#696E72]">
							<span className="text-center sm:text-left">
								Showing{" "}
								{table.getState().pagination.pageIndex *
									table.getState().pagination.pageSize +
									1}{" "}
								to{" "}
								{Math.min(
									(table.getState().pagination.pageIndex + 1) *
										table.getState().pagination.pageSize,
									table.getFilteredRowModel().rows.length
								)}{" "}
								of {table.getFilteredRowModel().rows.length} entries
							</span>
						</div>

						<DataTablePagination
							table={table}
							showRowsSelection={false}
							className="border-0 p-0"
						/>

						<Button
							variant="link"
							className="text-[#4D7C0F] border-[1px] border-[#ECFCCB] p-2 w-full sm:w-auto">
							See All
						</Button>
					</div>
				</>
			)}

			<HireHistoryDetailsSheet
				item={selectedItem}
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
			/>
		</div>
	);
};
