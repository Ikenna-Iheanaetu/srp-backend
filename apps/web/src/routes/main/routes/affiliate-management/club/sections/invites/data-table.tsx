/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { columns, filters } from "./columns";
import { invitedAffiliatesQueries } from "./query-factory";

export const useInvitedAffiliatesTableConfig = () => {
	return useServerTableQuery({
		getQueryOptions: invitedAffiliatesQueries.affiliates,
		tableColumnsDef: columns,
		filterColumnsConfig: filters,
	});
};

export const InvitedAffiliatesDataTable = () => {
	const { dataTableAdvancedProps } = useInvitedAffiliatesTableConfig();
	return (
		<div className="h-96 overflow-y-auto">
			<DataTableAdvanced {...dataTableAdvancedProps} />
		</div>
	);
};
