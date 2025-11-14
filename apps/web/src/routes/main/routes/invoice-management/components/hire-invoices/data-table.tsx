/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { useState } from "react";
import { createHireInvoiceColumns } from "./columns";
import { HireInvoice, invoiceManagementQueries } from "../../query-factory";
import { HireRecordDetailsSheet } from "./hire-record-details-sheet";

export const useHireInvoicesTableConfig = () => {
	return useServerTableQuery({
		getQueryOptions: (params) =>
			invoiceManagementQueries.company({
				page: params.page,
				limit: params.limit,
				search: params.search,
				status: params.status as string | undefined,
			}),
		tableColumnsDef: [],
	});
};

export const HireInvoicesTable = () => {
	const [selectedInvoice, setSelectedInvoice] = useState<HireInvoice | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const handleViewDetails = (invoice: HireInvoice) => {
		setSelectedInvoice(invoice);
		setIsSheetOpen(true);
	};

	const columns = createHireInvoiceColumns(handleViewDetails);

	const { dataTableAdvancedProps } = useServerTableQuery({
		getQueryOptions: (params) =>
			invoiceManagementQueries.company({
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
			<HireRecordDetailsSheet
				invoice={selectedInvoice}
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
			/>
		</>
	);
};
