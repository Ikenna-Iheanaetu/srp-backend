/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useCompaniesTableQuery } from "./hooks/use-companies-table-query";

export function CompaniesDataTable() {
	const { dataTableAdvancedProps } = useCompaniesTableQuery();

	return <DataTableAdvanced {...dataTableAdvancedProps} />;
}
