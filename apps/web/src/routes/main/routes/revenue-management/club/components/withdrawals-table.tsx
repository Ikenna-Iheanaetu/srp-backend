/** @format */

import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	SortingState,
	useReactTable,
	ColumnDef,
} from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/data-table";
import { DataTablePagination } from "@/components/common/data-table/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { EmptyState } from "./empty-state";

// Data Types
export interface WithdrawalItem {
	id: string;
	date: string;
	company: string;
	withdrawalId: string;
	amount: string;
	status: "pending" | "approved" | "rejected" | "processed";
}

// Columns Definition
const createWithdrawalsColumns = (): ColumnDef<WithdrawalItem>[] => [
	{
		accessorKey: "date",
		header: "Date/Time",
		cell: ({ row }) => (
			<span className="text-gray-900">{row.original.date}</span>
		),
	},
	{
		accessorKey: "company",
		header: "Company Name",
		cell: ({ row }) => (
			<span className="text-gray-900">{row.original.company}</span>
		),
	},
	{
		accessorKey: "withdrawalId",
		header: "Withdrawal ID",
		cell: ({ row }) => (
			<span className="text-gray-900">{row.original.withdrawalId}</span>
		),
	},
	{
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }) => (
			<span className="text-gray-900">{row.original.amount}</span>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.original.status;
			const getStatusConfig = (status: string) => {
				switch (status) {
					case "paid":
						return {
							variant: "default" as const,
							className: "bg-green-100 text-green-800",
							label: "Paid"
						};
					case "pending":
						return {
							variant: "secondary" as const,
							className: "bg-yellow-100 text-yellow-800",
							label: "Pending"
						};
					case "rejected":
						return {
							variant: "secondary" as const,
							className: "bg-red-100 text-red-800",
							label: "Rejected"
						};
					case "processed":
						return {
							variant: "secondary" as const,
							className: "bg-blue-100 text-blue-800",
							label: "Processed"
						};
					default:
						return {
							variant: "secondary" as const,
							className: "bg-gray-100 text-black",
							label: status
						};
				}
			};

			const config = getStatusConfig(status);
			
			return (
				<Badge
					variant={config.variant}
					className={cn(config.className)}
				>
					{config.label}
				</Badge>
			);
		},
	},
];

// Withdrawals Table Component
export const WithdrawalsTable: React.FC<{ data: WithdrawalItem[]  }> = ({ data }) => {
	console.log('data', data);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	const handleExport = (format: string) => {
		console.log(`Exporting as ${format}`);
		// TODO: Implement actual export functionality
	};

	// 1. Create columns definition
	const columns = createWithdrawalsColumns();

	// 2. Setup table with TanStack Table
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
				<h2 className="text-lg md:text-xl font-semibold">Withdrawals</h2>

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
					title="No Withdrawals Found"
					description="No withdrawal transactions have been recorded yet"
				/>
			) : (
				<>
					{/* 3. Render with DataTable component */}
					<DataTable
						table={table}
						className="border border-gray-200 shadow-lg rounded-lg"
					/>

					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
						<div className="text-xs md:text-sm text-gray-500">
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
					</div>
				</>
			)}
		</div>
	);
};
