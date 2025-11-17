/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { columns, filters } from "./columns";
import { unclaimedInvitesQueries } from "./query-factory";

const useUnclaimedInvitesTableConfig = () => {
	const queryConfig = useServerTableQuery({
		getQueryOptions: unclaimedInvitesQueries.invites,
		filterColumnsConfig: filters,
		tableColumnsDef: columns,
	});

	return queryConfig;
};

const UnclaimedInvitesDataTable = () => {
	const { dataTableAdvancedProps } = useUnclaimedInvitesTableConfig();

	return <DataTableAdvanced {...dataTableAdvancedProps} />;
};

export { UnclaimedInvitesDataTable, useUnclaimedInvitesTableConfig };
