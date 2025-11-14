/** @format */

import { useURLTableQueryParams } from "@/hooks/data-table/use-url-table-query-params";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { toast } from "sonner";
import { shortlistedJobsQueries } from "../../query-factory";
import { ShortlistedJob } from "./columns";
import { ShortlistedJobFilters } from "./table-filters";

export const useRemoveShortlistedJob = () => {
	const { queryParams } = useURLTableQueryParams<ShortlistedJobFilters>();
	const queryKey = shortlistedJobsQueries.jobs(queryParams).queryKey;
	const toastId = "shortlisted-job-remove";

	return useOptimisticMutation({
		mutationFn: async (job: ShortlistedJob) => {
			await apiAxiosInstance.delete("/shortlisted/" + job.id);
		},
		queryKey,
		updater: (old, job) => {
			if (!old) return old;

			return {
				...old,
				data: old.data.filter((prevJob) => prevJob.id !== job.id),
			};
		},
		onError: (error, job) => {
			toast.error(
				`Failed to remove job - ${job.title} - from shortlisted`,
				{
					id: toastId + "error" + job.id,
					description: getApiErrorMessage(error),
				},
			);
		},
		onSuccess: (_, job) => {
			toast.success(
				`Job - ${job.title} - successfully removed from shortlisted`,
				{
					id: toastId + "success" + job.id,
				},
			);
		},
		meta: {
			errorMessage: "none",
		},
	});
};
