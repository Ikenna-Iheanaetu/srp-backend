/** @format */

import { ColumnDef } from "@tanstack/react-table";
import { WithdrawalInvoice } from "../../query-factory";
import { formatCurrency } from "@/lib/helper-functions";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";

export const createWithdrawalInvoiceColumns = (
	onViewDetails: (invoice: WithdrawalInvoice) => void,
	onUpdateStatus: (invoice: WithdrawalInvoice) => void,
	onExportInvoice: (invoice: WithdrawalInvoice) => void
): ColumnDef<WithdrawalInvoice>[] => [
	{
		accessorKey: "invoiceId",
		header: "Invoice ID",
		cell: ({ row }) => {
			return <span className="text-gray-900 font-medium">{row.original.invoiceId}</span>;
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
		accessorKey: "amount",
		header: "Amount (30% of total)",
		cell: ({ row }) => {
			return (
				<span className="text-gray-900">
					{formatCurrency(row.original.amount)}
				</span>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.original.status;
			const getStatusStyle = () => {
				switch (status) {
					case "Paid":
						return "status-green";
					case "Pending":
						return "status-yellow";
					case "Overdue":
						return "status-red";
					case "Cancelled":
						return "status-gray";
					case "Rejected":
						return "status-red";
					case "Processed":
						return "status-blue";
					default:
						return "status-gray";
				}
			};
			return (
				<Badge variant="secondary" className={getStatusStyle()}>
					{status}
				</Badge>
			);
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
					<DropdownMenuContent align="end" className="w-[180px]">
						<DropdownMenuItem
							onClick={() => onViewDetails(row.original)}
							className="cursor-pointer bg-lime-50 hover:bg-lime-100 focus:bg-lime-100">
							View Invoice
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onUpdateStatus(row.original)}
							className="cursor-pointer">
							Update Status
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onExportInvoice(row.original)}
							className="cursor-pointer">
							Export Invoice
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

