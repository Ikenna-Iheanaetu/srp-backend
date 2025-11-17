/** @format */

import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { UserNotification } from "../columns";
import {
	useNotificationsTableQuery,
	UseNotificationsTableQueryOptions,
} from "./use-notifications-table-query";

interface UseUpdateNotificationStatusOptions
	extends UseNotificationsTableQueryOptions {
	disableToasts?: boolean;
}

export const useUpdateNotificationsStatuses = ({
	disableToasts = false,
	queryParams,
}: UseUpdateNotificationStatusOptions = {}) => {
	const { queryOptions } = useNotificationsTableQuery({ queryParams });

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (body: {
			ids: string[];
			/**The target status. */
			status: UserNotification["status"];
		}) => {
			await apiAxiosInstance.patch("/notifications/bulk", body, {
				skipUserTypePrefix: true,
			});
		},
		updater: (old, { ids, status: targetStatus }) => {
			if (!old) {
				return old;
			}

			return {
				...old,
				data: old.data.map((notification) => ({
					...notification,
					status: ids.includes(notification.id)
						? targetStatus
						: notification.status,
				})),
			};
		},
		onSuccess: (_, { ids, status }) => {
			if (!disableToasts) {
				toast.success(
					`${ids.length} notification${
						ids.length > 1 ? "s" : ""
					} marked as ${status}`,
				);
			}
		},
		onError: (error, { ids, status }) => {
			if (!disableToasts) {
				toast.error(
					`Failed to update ${ids.length} notification${
						ids.length > 1 ? "s" : ""
					} status to ${status}`,
					{ description: getErrorMessage(error) },
				);
			}
		},
		meta: {
			errorMessage: "none",
		},
	});
};
