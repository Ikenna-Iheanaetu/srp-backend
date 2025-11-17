/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { href, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { EntityProfileParams } from "../../../../entity/schemas";
import { profileQueries } from "../../../../profile/query-factory";
import { NewJobFormData } from "../form-schema";
import {
	StateWithJobPreview,
	useJobPreviewState,
} from "../hooks/use-job-preview-state";
import { PreviewJob } from "./job-preview";

const usePostNewJob = () => {
	const navigate = useNavigate();
	return useMutation({
		mutationFn: async (data: NewJobFormData) => {
			await apiAxiosInstance.post("/jobs", data);
		},
		onSuccess: async (_, job) => {
			toast.success(`Successfully posted job, ${job.title}.`);
			await navigate(href("/job-management/posted"));
		},
		onError: (error, job) => {
			toast.error(`Error occurred posting job, ${job.title}.`, {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface PreviewNewJobProps {
	onEdit: (existingJobData: NewJobFormData) => void;
}

export const PreviewNewJob: React.FC<PreviewNewJobProps> = ({ onEdit }) => {
	const { previewState } = useJobPreviewState();
	if (!previewState.isPreviewing) {
		throw new Error(
			"[PreviewNewJob]: Preview state must be in previewing to use this component.",
		);
	}

	const { data: profile } = useQuery(profileQueries.byUserType("company"));
	const { mutate: postJob, isPending: isPostingJob } = usePostNewJob();
	const location = useLocation();
	const navigate = useNavigate();

	const job = previewState.jobData;

	return profile ? (
		<div className="mx-auto w-full">
			<PreviewJob
				job={{
					...job,
					company: {
						name: profile.name,
						about: profile.about,
					},
				}}
				onViewCompany={() =>
					void navigate(
						href("/:userType/:id", {
							userType: "company",
							id: profile.id,
						} satisfies EntityProfileParams),
						{
							state: {
								crumbs: [
									{
										to: location,
										state: {
											jobPreview: previewState,
										} satisfies StateWithJobPreview,
										label: `Creating Job, ${job.title}`,
									},
									{
										label: `Your company in third-party view`,
									},
								],
							} satisfies CrumbsLocationState,
						},
					)
				}
			/>

			<div className="item-center flex justify-end gap-2">
				<Button
					type="button"
					onClick={() => onEdit(job)}
					variant="outline">
					Edit
				</Button>

				<Button
					onClick={() => postJob(job)}
					disabled={isPostingJob}
					className="button">
					{isPostingJob ? <LoadingIndicator /> : "Post"}
				</Button>
			</div>
		</div>
	) : (
		<LoadingIndicator />
	);
};
