/** @format */

import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SHORTLIST_MUTATION_PATH } from "../../../../mutation-utils";
import { ServerShortlistCandidateBody } from "../../../search/use-shortlist-candidate";
import { ShortlistedCandidate } from "./columns";
import { useMutationSetup } from "./use-mutation-setup";
import { jobsQueries } from "../../../../../jobs/query-factory";

const handleRemoveCandidate = async (body: ServerShortlistCandidateBody) => {
	await apiAxiosInstance.post(SHORTLIST_MUTATION_PATH + "/remove", body);
};

export const useRemoveCandidate = () => {
	const { queryClient, queryKey, jobId } = useMutationSetup();

	const toastId = "shortlisted-candidate-remove";

	const jobData = queryClient.getQueryData(jobsQueries.detail(jobId!).queryKey);
	const jobTitle = jobData?.title ?? "Unknown Job";

	return useMutation({
		mutationFn: (candidate: ShortlistedCandidate) =>
			handleRemoveCandidate({
				candidate: candidate.id,
				jobs: [jobId!],
			}),
		onMutate: (candidate) => {
			const prevData = queryClient.getQueryData(queryKey);

			queryClient.setQueryData(queryKey, (old) => {
				if (!old) return old;

				return {
					...old,
					data: old.data.filter(
						(prevCandidate) => prevCandidate.id !== candidate.id,
					),
				};
			});

			return { prevData };
		},
		onSuccess: (_, candidate) => {
			toast.success(
				`Candidate - ${candidate.name}, successfully removed from shortlist for ${jobTitle}`,
				{
					id: toastId + "success" + candidate.id,
				},
			);
		},
		onError: (error, candidate, context) => {
			queryClient.setQueryData(queryKey, context?.prevData);
			toast.error(
				`Failed to remove candidate - ${candidate.name} - from shortlist for ${jobTitle}`,
				{
					id: toastId + "error" + candidate.id,
					description: getApiErrorMessage(error),
				},
			);
		},
	});
};
