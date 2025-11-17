/** @format */

import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { clubManagementQueries } from "../../../query-factory";
import { columns } from "./columns";

export const useClubsTableQuery = () => {
	return useServerTableQuery({
		getQueryOptions: clubManagementQueries.clubs,
		tableColumnsDef: columns,
	});
};
