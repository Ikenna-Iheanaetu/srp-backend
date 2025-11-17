/** @format */

import { BookmarkButton } from "@/components/common/bookmark-btn";
import { LinkButton } from "@/components/common/link-btn";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { matchQueryStatus } from "@/lib/helper-functions/async-status-render-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { EntityProfileParams } from "@/routes/main/routes/entity/schemas";
import { PreviewJob } from "@/routes/main/routes/job-management/routes/new-job/components/job-preview";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FC } from "react";
import { href, useLocation, useNavigate } from "react-router";
import {
	bookmarkJobMutationFn,
	handleBookmarkJobOnError,
	handleBookmarkJobOnSuccess,
} from "../../../mutation-utils";
import { JobDetailsQueryKey, jobsQueries } from "../../../query-factory";
import { BaseJob } from "../../../types";
import { useJobDetails } from "../use-job-details";
import ShareJobBtn from "./share-job-btn";

interface UseBookmarkJobProps {
	queryKey: JobDetailsQueryKey;
}

const useBookmarkJob = ({ queryKey }: UseBookmarkJobProps) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: queryKey,
		mutationFn: (job: BaseJob) => bookmarkJobMutationFn(job.id),
		// Optimistic update
		onMutate: async () => {
			// Cancel any outgoing refetches to avoid overwriting our optimistic update
			await queryClient.cancelQueries({ queryKey });

			// Get the previous data from the cache
			const prevJob = queryClient.getQueryData(queryKey);

			// Optimistically update the job's bookmark status
			queryClient.setQueryData(queryKey, (prevJob) => {
				if (!prevJob) return prevJob; // If no data, return unchanged
				return {
					...prevJob,
					isBookmarked: !prevJob.isBookmarked,
				};
			});

			// Return the previous state for rollback in case of error
			return { prevJob };
		},
		onSuccess: (_, job) => handleBookmarkJobOnSuccess({ job }),
		onError: (error, job, context) => {
			// Roll back to the previous state on error
			queryClient.setQueryData(queryKey, context?.prevJob);

			handleBookmarkJobOnError({ job, error });
		},
	});
};

const PlayerJobDetails: FC = () => {
	const query = useJobDetails();
	const { data: jobDetails } = query;
	const { mutate } = useBookmarkJob({
		queryKey: jobsQueries.detail(jobDetails?.id ?? "").queryKey,
	});

	const location = useLocation();
	const navigate = useNavigate();

	return matchQueryStatus(query, {
		Loading: <LoadingIndicator />,
		Errored: (error) => (
			<p className="text-red-500">{getApiErrorMessage(error)}</p>
		),
		Empty: <p className="text-red-500">Invalid response recieved</p>,
		Success: ({ data: job }) => (
			<div className="flex flex-col gap-8">
				<PreviewJob
					job={job}
					onViewCompany={() =>
						void navigate(
							href("/:userType/:id", {
								userType: "company",
								id: job.company.id,
							} satisfies EntityProfileParams),
							{
								state: {
									crumbs: [
										{
											to: location,
											label: `Job, ${job.title}`,
										},
										{
											label: `Company, ${job.company.name}`,
										},
									],
								} satisfies CrumbsLocationState,
							},
						)
					}
				/>

				{/* footer section */}
				<footer className="mt-8 flex items-center justify-evenly gap-4 [&_svg]:stroke-black">
					<ShareJobBtn />

					<BookmarkButton
						isBookmarked={job.isBookmarked}
						onClick={() => mutate(job)}
					/>

					<LinkButton
						className="!px-16 button"
						to={href("/jobs/apply/:id", {
							id: job.id,
						})}>
						Apply
					</LinkButton>
				</footer>
			</div>
		),
	});
};

export default PlayerJobDetails;
