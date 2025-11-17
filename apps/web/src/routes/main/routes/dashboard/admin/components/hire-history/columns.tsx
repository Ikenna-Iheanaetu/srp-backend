/** @format */

import { TableDateCell } from "@/components/common/data-table/date-cell";
import { formatCurrency } from "@/lib/helper-functions";
import { ColumnDef } from "@tanstack/react-table";
import { HireHistoryItem } from "../../query-factory";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
// import { MoreVertical } from "lucide-react";

export const createHireHistoryColumns = (
	onViewDetails: (item: HireHistoryItem) => void
): ColumnDef<HireHistoryItem>[] => [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => (
			<button
				type="button"
				className="text-[#00647E] font-normal hover:underline text-left">
				{row.original.name}
			</button>
		),
	},
	{
		accessorKey: "companyName",
		header: "Company Name",
		cell: ({ row }) => (
			<span className="text-[#101828]">{row.original.companyName}</span>
		),
	},
	{
		accessorKey: "club",
		header: "Club",
		cell: ({ row }) => (
			<span className="text-[#101828]">{row.original.club}</span>
		),
	},
	{
		accessorKey: "invoiceId",
		header: "Invoice ID",
		cell: ({ row }) => (
			<span className="text-[#101828]">{row.original.invoiceId}</span>
		),
	},
	{
		accessorKey: "amount",
		header: "Amount (30% of total)",
		cell: ({ row }) => {
			const amount: number = row.original.amount;
			return (
				<span className="text-[#101828] font-normal">
					{formatCurrency(amount)}
				</span>
			);
		},
	},
	{
		accessorKey: "dateTime",
		header: "Date/Time",
		cell: ({ row }) => (
			<span className="text-gray-900">
				<TableDateCell date={row.original.dateTime} />
			</span>
		),
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0">
						<MoreVertical className="h-4 w-4 text-gray-400" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={() => onViewDetails(row.original)}>
						View History
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => {
							console.log("Export history for:", row.original.id);
							// TODO: Implement export history
						}}>
						Export History
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
];
