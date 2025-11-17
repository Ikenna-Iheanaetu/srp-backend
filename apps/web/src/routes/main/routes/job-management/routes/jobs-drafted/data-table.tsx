/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { columns, filters } from "./columns";
import { draftedJobsQueries } from "./query-factory";

export const useDraftedJobsTableConfig = () => {
	return useServerTableQuery({
		getQueryOptions: draftedJobsQueries.jobs,
		tableColumnsDef: columns,
		filterColumnsConfig: filters,
	});
};

export const DraftedJobsTable = () => {
	const { dataTableAdvancedProps } = useDraftedJobsTableConfig();

	return <DataTableAdvanced {...dataTableAdvancedProps} />;
};
