/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { PaginatedServerResponse } from "@/types/pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { queryOptions } from "@tanstack/react-query";
import { NotificationFilters, UserNotification } from "./table/columns";

export type NotificationsQueryParams = TableQueryParams<NotificationFilters>;

type PaginatedNotifications = PaginatedServerResponse<UserNotification>;
type NotificationsApiResponse = ApiSuccessResponse<{
	data: PaginatedNotifications;
}>;
const fetchNotifications = async (
	params: NotificationsQueryParams,
): Promise<PaginatedNotifications> => {
	const response = await apiAxiosInstance.get<NotificationsApiResponse>(
		"/notifications",
		{
			params,
			skipUserTypePrefix: true,
		},
	);

	return response.data.data;
};

// Query options for reusable notification fetching
export const notificationsQueries = {
	all: () => ["user-notifications"] as const,
	notifications: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: Partial<NotificationsQueryParams>) => {
		const params: NotificationsQueryParams = { page, limit, ...others };
		return queryOptions({
			queryKey: [...notificationsQueries.all(), params] as const,
			queryFn: () => fetchNotifications(params),
			meta: {
				onError: () => "Failed to fetch notifications",
			},
		});
	},
};

export type NotificationStatus = "unread" | "read";
