/** @format */

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { WithdrawalInvoice } from "../../query-factory";

interface UpdateStatusDialogProps {
	invoice: WithdrawalInvoice | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUpdateStatus: (invoiceId: string, status: string) => void;
}

export const UpdateStatusDialog: React.FC<UpdateStatusDialogProps> = ({
	invoice,
	open,
	onOpenChange,
	onUpdateStatus,
}) => {
	const [selectedStatus, setSelectedStatus] = useState<string>(
		invoice?.status || "Pending"
	);

	const handleSubmit = () => {
		if (invoice) {
			onUpdateStatus(invoice.id, selectedStatus);
			onOpenChange(false);
		}
	};

	if (!invoice) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Update Withdrawal Status</DialogTitle>
					<DialogDescription>
						Update the status of withdrawal for {invoice.club}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="invoice-id">Invoice ID</Label>
						<div
							id="invoice-id"
							className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700 font-medium">
							{invoice.invoiceId}
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="club">Club</Label>
						<div
							id="club"
							className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700">
							{invoice.club}
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="amount">Amount</Label>
						<div
							id="amount"
							className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700 font-medium">
							${invoice.amount.toLocaleString()}
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="status">Status</Label>
						<Select
							value={selectedStatus}
							onValueChange={setSelectedStatus}>
							<SelectTrigger id="status">
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Pending">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-yellow-500" />
										Pending
									</div>
								</SelectItem>
								<SelectItem value="Paid">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-green-500" />
										Paid
									</div>
								</SelectItem>
								<SelectItem value="Rejected">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-red-500" />
										Rejected
									</div>
								</SelectItem>
								<SelectItem value="Processed">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-blue-500" />
										Processed
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSubmit}>Update Status</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

