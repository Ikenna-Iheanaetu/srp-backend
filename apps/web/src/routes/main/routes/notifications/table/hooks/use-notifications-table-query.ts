/** @format */
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import {
	notificationsQueries,
	NotificationsQueryParams,
} from "../../query-factory";
import { columns, filters } from "../columns";

export interface UseNotificationsTableQueryOptions {
	queryParams?: NotificationsQueryParams;
}

export const useNotificationsTableQuery = ({
	queryParams,
}: UseNotificationsTableQueryOptions = {}) => {
	return useServerTableQuery({
		getQueryOptions: (params) =>
			notificationsQueries.notifications({
				...params,
				...queryParams,
			}),
		tableColumnsDef: columns,
		filterColumnsConfig: filters,
	});
};
