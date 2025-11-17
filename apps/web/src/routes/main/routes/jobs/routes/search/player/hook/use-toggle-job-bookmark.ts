/** @format */

import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { toast } from "sonner";
import { BaseJob } from "../../../../types";
import { useFetchSearchResults } from "./use-fetch-search-results";

export const useToggleJobBookmark = () => {
	const { queryOptions } = useFetchSearchResults();

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (jobToToggle: BaseJob) => {
			await apiAxiosInstance.post("/jobs/bookmarks/" + jobToToggle.id);
		},
		updater: (old, job) => {
			if (!old) {
				return old;
			}

			return {
				...old,
				data: old.data.map((j) =>
					j.id === job.id
						? {
								...j,
								isBookmarked: !j.isBookmarked,
							}
						: j,
				),
			};
		},
		onSuccess: (_, jobToToggle) => {
			const message = jobToToggle.isBookmarked
				? `Successfully removed job, ${jobToToggle.title}, from bookmarks.`
				: `Successfully added job, ${jobToToggle.title}, to bookmarks.`;

			toast.success(message);
		},
		onError: (error, jobToToggle) => {
			const message = jobToToggle.isBookmarked
				? `Couldn't remove job, ${jobToToggle.title}, from bookmarks.`
				: `Couldn't add job, ${jobToToggle.title}, to bookmarks.`;
			toast.error(message, {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
