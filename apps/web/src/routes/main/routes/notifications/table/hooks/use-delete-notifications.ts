/** @format */

import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { calculateNewMeta } from "@/lib/helper-functions/pagination";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { useNotificationsTableQuery } from "./use-notifications-table-query";

export const useDeleteNotifications = () => {
	const { queryOptions } = useNotificationsTableQuery();

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (body: { ids: string[] }) => {
			await apiAxiosInstance.delete("/notifications/bulk", {
				data: body,
				skipUserTypePrefix: true,
			});
		},
		updater: (old, { ids }) => {
			if (!old) {
				return old;
			}

			const filteredNotifications = old.data.filter(
				(notification) => !ids.includes(notification.id),
			);

			const actualItemsRemoved =
				old.data.length - filteredNotifications.length;

			const newTotalItems = old.meta.total - actualItemsRemoved;

			const newMeta = calculateNewMeta({
				newDataTotal: newTotalItems,
				prevMeta: old.meta,
			});

			return {
				...old,
				data: filteredNotifications,
				meta: newMeta,
			};
		},
		onSuccess: (_, { ids }) => {
			toast.success(
				`Successfully deleted ${ids.length} notification${
					ids.length > 1 ? "s" : ""
				}.`,
			);
		},
		onError: (error, { ids }) => {
			toast.error(
				`Failed to delete ${ids.length} notification${
					ids.length > 1 ? "s" : ""
				}.`,
				{ description: getErrorMessage(error) },
			);
		},
		meta: {
			errorMessage: "none",
		},
	});
};
