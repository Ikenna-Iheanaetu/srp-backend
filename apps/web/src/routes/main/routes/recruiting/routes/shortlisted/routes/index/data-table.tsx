/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { shortlistedJobsQueries } from "../../query-factory";
import { columns } from "./columns";
import { shortlistedJobsFiltersConfig } from "./table-filters";

export function ShortlistedJobsDataTable() {
	const { dataTableAdvancedProps } = useServerTableQuery({
		tableColumnsDef: columns,
		filterColumnsConfig: shortlistedJobsFiltersConfig,
		getQueryOptions: shortlistedJobsQueries.jobs,
	});

	return <DataTableAdvanced {...dataTableAdvancedProps} />;
}
