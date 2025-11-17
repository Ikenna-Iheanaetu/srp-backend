/** @format */

import { usePagination } from "@/hooks/use-pagination";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hiredJobsQueries } from "../../query-factory";
import { HiredJob } from "./columns";

export const useRemoveJob = () => {
	const queryClient = useQueryClient();
	const { pageIndex, pageSize } = usePagination();
	const queryKey = hiredJobsQueries.jobs({
		page: pageIndex + 1,
		limit: pageSize,
	}).queryKey;

	const toastId = "hired-job-remove";

	return useMutation({
		mutationKey: queryKey,
		mutationFn: async (job: HiredJob) => {
			await apiAxiosInstance.delete("/hired/" + job.id);
		},
		onMutate: (job) => {
			const prevJobs = queryClient.getQueryData(queryKey);

			queryClient.setQueryData(queryKey, (old) => {
				if (!old) return old;

				return {
					...old,
					data: old.data.filter((prevJob) => prevJob.id !== job.id),
				};
			});

			return { prevJobs };
		},
		onSuccess: (_, job) => {
			toast.success(
				`${job.title} - successfully removed from hired jobs`,
				{
					id: toastId + "success" + job.id,
				},
			);
		},
		onError: (error, job, context) => {
			queryClient.setQueryData(queryKey, context?.prevJobs);
			toast.error(
				`Failed to remove job - ${job.title} - from hired jobs`,
				{
					id: toastId + "error" + job.id,
					description: getApiErrorMessage(error),
				},
			);
		},
	});
};
