/** @format */

import { LinkButton } from "@/components/common/link-btn";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useMutation } from "@tanstack/react-query";
import { href } from "react-router";
import { toast } from "sonner";
import { HIRE_MUTATION_PATH } from "../../../../mutation-utils";
import { ShortlistedCandidate } from "./columns";
import { jobsQueries } from "../../../../../jobs/query-factory";
import { useMutationSetup } from "./use-mutation-setup";

interface ServerHireCandidateBody {
	candidate: string;
	job: string;
}

const handleHireCandidate = async (body: ServerHireCandidateBody) => {
	await apiAxiosInstance.post(HIRE_MUTATION_PATH, body);
};

export const useHireCandidate = () => {
	const { queryClient, queryKey, jobId } = useMutationSetup();

	const toastId = "shortlisted-candidate-hire";

	// Get job data to access the title
	const jobData = queryClient.getQueryData(jobsQueries.detail(jobId!).queryKey);
	const jobTitle = jobData?.title ?? "Unknown Job";

	return useMutation({
		mutationKey: queryKey,
		mutationFn: (candidate: ShortlistedCandidate) =>
			handleHireCandidate({ candidate: candidate.id, job: jobId! }),
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
				`${candidate.name} - successfully hired for ${jobTitle}`,
				{
					id: toastId + "success" + candidate.id,
					description: (
						<LinkButton
							to={href("/recruiting/hired")}
							className="button">
							Hired jobs
						</LinkButton>
					),
				},
			);
		},
		onError: (error, candidate, context) => {
			queryClient.setQueryData(queryKey, context?.prevData);
			toast.error(
				`Failed to hire ${candidate.name} for ${jobTitle}`,
				{
					id: toastId + "error" + candidate.id,
					description: getApiErrorMessage(error),
				},
			);
		},
	});
};
