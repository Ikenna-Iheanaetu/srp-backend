/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { PlayerDynamicCardData } from "@/components/user-dynamic-cards/player-card";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useMutation } from "@tanstack/react-query";
import { href } from "react-router";
import { toast } from "sonner";
import { SHORTLIST_MUTATION_PATH } from "../../mutation-utils";

export interface ServerShortlistCandidateBody {
	candidate: string;
	jobs: string[];
}

const shortlistCandidate = async (body: ServerShortlistCandidateBody) => {
	await apiAxiosInstance.post(SHORTLIST_MUTATION_PATH, body);
};

interface Variables {
	candidate: PlayerDynamicCardData;
	jobIds: string[];
}

export function useShortlistCandidate() {
	const toastId = "candidate-shortlist";

	return useMutation({
		mutationFn: ({ candidate, jobIds }: Variables) =>
			shortlistCandidate({ candidate: candidate.id, jobs: jobIds }),

		onError: (error, { candidate }) => {
			toast.error("Couldn't shortlist candidate - " + candidate.name, {
				id: toastId + "error" + candidate.id,
				description: getApiErrorMessage(error),
			});
		},
		onSuccess: (_, { candidate, jobIds }) => {
			const numOfIds = jobIds.length;
			toast.success(
				`${candidate.name} shortlisted for ${numOfIds} job${
					numOfIds > 1 ? "s" : ""
				}`,
				{
					id: toastId + "success" + candidate.id,
					description: (
						<LinkButton
							to={href("/recruiting/shortlisted")}
							className="button">
							Shortlisted
						</LinkButton>
					),
				},
			);
		},
	});
}
