/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { useState } from "react";
import { createColumns } from "./columns";
import { RequestDetailsSheet } from "./request-details-sheet";
import { Request } from "./types";
import { requestManagementQueries } from "../../query-factory";

export const RequestsDataTable = () => {
	const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const handleViewDetails = (request: Request) => {
		setSelectedRequest(request);
		setIsSheetOpen(true);
	};

	const columns = createColumns(handleViewDetails);

	const { dataTableAdvancedProps } = useServerTableQuery({
		getQueryOptions: (params) =>
			requestManagementQueries.list({
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
			<RequestDetailsSheet
				request={selectedRequest}
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
			/>
		</>
	);
};

