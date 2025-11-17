/** @format */

import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { usePagination } from "@/hooks/use-pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { calculateNewMeta } from "@/lib/helper-functions/pagination";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { clubManagementQueries } from "../../../query-factory";
import { Club } from "./columns";

export const useDeleteClub = () => {
	const { pageIndex, pageSize } = usePagination();
	const queryKey = clubManagementQueries.clubs({
		page: pageIndex + 1,
		limit: pageSize,
	}).queryKey;

	return useOptimisticMutation({
		queryKey,
		mutationFn: async (club: Club) => {
			await apiAxiosInstance.delete("/admin/club/" + club.id);
		},
		updater: (old, club) => {
			if (!old) return old;

			const filteredClubs = old.data.filter(
				(prevClub) => prevClub.id !== club.id,
			);

			const actualItemsRemoved = old.data.length - filteredClubs.length;

			const newDataTotal = old.meta.total - actualItemsRemoved;

			const newMeta = calculateNewMeta({
				newDataTotal,
				prevMeta: old.meta,
			});

			return {
				...old,
				data: filteredClubs,
				meta: newMeta,
			};
		},

		onError: (error, club) => {
			toast.error(`Failed to delete club - ${club.name}`, {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
