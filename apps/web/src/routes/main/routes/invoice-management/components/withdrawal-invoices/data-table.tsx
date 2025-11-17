/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { useState } from "react";
import { createWithdrawalInvoiceColumns } from "./columns";
import { WithdrawalInvoice, invoiceManagementQueries, updateWithdrawalStatusData } from "../../query-factory";
import { WithdrawalInvoiceDetailsSheet } from "./withdrawal-invoice-details-sheet";
import { UpdateStatusDialog } from "./update-status-dialog";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const WithdrawalInvoicesTable = () => {
	const [selectedInvoice, setSelectedInvoice] = useState<WithdrawalInvoice | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
	const queryClient = useQueryClient();

	const updateStatusMutation = useMutation({
		mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
			await updateWithdrawalStatusData(invoiceId, status);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: invoiceManagementQueries.all() });
			toast.success("Withdrawal status updated successfully");
		},
		onError: (error) => {
			console.error("Error updating status:", error);
			toast.error("Failed to update withdrawal status");
		},
	});

	const handleViewDetails = (invoice: WithdrawalInvoice) => {
		setSelectedInvoice(invoice);
		setIsSheetOpen(true);
	};

	const handleUpdateStatus = (invoice: WithdrawalInvoice) => {
		setSelectedInvoice(invoice);
		setIsStatusDialogOpen(true);
	};

	const handleExportInvoice = (invoice: WithdrawalInvoice) => {
		// TODO: Implement export functionality
		toast.success(`Exporting invoice ${invoice.invoiceId}...`);
		console.log("Export invoice:", invoice);
	};

	const handleStatusUpdate = (invoiceId: string, status: string) => {
		updateStatusMutation.mutate({ invoiceId, status });
	};

	const columns = createWithdrawalInvoiceColumns(
		handleViewDetails,
		handleUpdateStatus,
		handleExportInvoice
	);

	const { dataTableAdvancedProps } = useServerTableQuery({
		getQueryOptions: (params) =>
			invoiceManagementQueries.club({
				page: params.page,
				limit: params.limit,
				search: params.search,
				status: params.status as string | undefined,
			}),
		tableColumnsDef: columns,
	});

	return (
		<>
			<DataTableAdvanced {...dataTableAdvancedProps} />
			<WithdrawalInvoiceDetailsSheet
				invoice={selectedInvoice}
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
			/>
			<UpdateStatusDialog
				invoice={selectedInvoice}
				open={isStatusDialogOpen}
				onOpenChange={setIsStatusDialogOpen}
				onUpdateStatus={handleStatusUpdate}
			/>
		</>
	);
};
