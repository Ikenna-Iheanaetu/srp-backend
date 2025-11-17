/** @format */

import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { JobByCompany } from "../../../query-factory";
import { useJobsByCompanyQueryConfig } from "./use-jobs-by-company-query-config";

export const useToggleJobBookmark = () => {
	const { queryOptions } = useJobsByCompanyQueryConfig();

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (jobToToggle: JobByCompany) => {
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
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
