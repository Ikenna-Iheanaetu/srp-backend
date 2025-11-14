/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useNotificationsTableQuery } from "./hooks/use-notifications-table-query";

export const NotificationsTable = () => {
	const { dataTableAdvancedProps } = useNotificationsTableQuery();

	return <DataTableAdvanced {...dataTableAdvancedProps} />;
};
