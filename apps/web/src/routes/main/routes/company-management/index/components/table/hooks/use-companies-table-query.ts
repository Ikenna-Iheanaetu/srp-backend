/** @format */

import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { companyManagementQueries } from "../../../../query-factory";
import { columns } from "../columns";

export const useCompaniesTableQuery = () => {
	return useServerTableQuery({
		getQueryOptions: companyManagementQueries.companies,
		tableColumnsDef: columns,
	});
};
