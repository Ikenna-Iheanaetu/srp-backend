/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { columns, filters } from "./columns";
import { postedJobsQueries } from "./query-factory";

export const usePostedJobsTableConfig = () => {
	return useServerTableQuery({
		getQueryOptions: postedJobsQueries.jobs,
		tableColumnsDef: columns,
		filterColumnsConfig: filters,
	});
};

export const PostedJobsTable = () => {
	const { dataTableAdvancedProps } = usePostedJobsTableConfig();

	return <DataTableAdvanced {...dataTableAdvancedProps} />;
};
