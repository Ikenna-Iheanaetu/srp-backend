/** @format */

import { ColumnDef } from "@tanstack/react-table";
import { HireInvoice } from "../../query-factory";
import { formatCurrency } from "@/lib/helper-functions";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

export const createHireInvoiceColumns = (
	onViewDetails: (invoice: HireInvoice) => void
): ColumnDef<HireInvoice>[] => [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => {
			return (
				<span className="text-[#00647E] font-medium cursor-pointer">
					{row.original.name}
				</span>
			);
		},
	},
	{
		accessorKey: "companyName",
		header: "Company Name",
		cell: ({ row }) => {
			return <span className="text-gray-900">{row.original.companyName}</span>;
		},
	},
	{
		accessorKey: "club",
		header: "Club",
		cell: ({ row }) => {
			return <span className="text-gray-900">{row.original.club}</span>;
		},
	},
	{
		accessorKey: "invoiceId",
		header: "Invoice ID",
		cell: ({ row }) => {
			return <span className="text-gray-900">{row.original.invoiceId}</span>;
		},
	},
	{
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }) => {
			return (
				<span className="text-gray-900">
					{formatCurrency(row.original.amount)}
				</span>
			);
		},
	},
	{
		accessorKey: "dateTime",
		header: "Date/Time",
		cell: ({ row }) => {
			return <span className="text-gray-900">{row.original.dateTime}</span>;
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="h-8 w-8 p-0 hover:bg-gray-100">
							<span className="sr-only">Open menu</span>
							<MoreVertical className="h-4 w-4 text-gray-600" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[160px]">
						<DropdownMenuItem
							onClick={() => onViewDetails(row.original)}
							className="cursor-pointer">
							View Details
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => console.log("Download invoice", row.original.id)}
							className="cursor-pointer">
							Download
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => console.log("Send invoice", row.original.id)}
							className="cursor-pointer">
							Send Invoice
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

