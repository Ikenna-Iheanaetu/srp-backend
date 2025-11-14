/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useClubsTableQuery } from "./use-clubs-table-query";

export function ClubsDataTable() {
	const { dataTableAdvancedProps } = useClubsTableQuery();

	return <DataTableAdvanced {...dataTableAdvancedProps} />;
}
