/** @format */

import { FormBadgeList } from "@/components/common/form/badge-list-field";
import { FormSingleDatePicker } from "@/components/common/form/date-picker";
import { FormEmploymentTypeSelect } from "@/components/common/form/employment-types-select";
import { FormIndustryTreeSelect } from "@/components/common/form/industries-tree-select";
import { FormInput } from "@/components/common/form/input";
import FormSwitchToggle from "@/components/common/form/switch-toggle";
import { FormProviderWrapper } from "@/components/common/form/wrapper";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormJobSalaryRange } from "../new-job/components/form";
import { NewJobFormData, NewJobFormSchema } from "../new-job/form-schema";
import { PostedJob } from "./columns";
import { usePostedJobsTableConfig } from "./data-table";
import { getDirtyValues } from "@/lib/helper-functions/forms";

const useEditJob = () => {
	const { queryOptions } = usePostedJobsTableConfig();

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async ({
			jobId,
			updatedValues,
		}: {
			jobId: string;
			updatedValues: Partial<PostedJob>;
		}) => {
			await apiAxiosInstance.patch(`/jobs/${jobId}`, updatedValues);
		},
		updater: (old, { jobId, updatedValues }) => {
			if (!old) return old;
			return {
				...old,
				data: old.data.map((oldJob) =>
					oldJob.id === jobId
						? { ...oldJob, ...updatedValues }
						: oldJob,
				),
			};
		},

		meta: {
			errorMessage: "none",
		},
	});
};

interface Props {
	job: PostedJob;
	onFinishEditting: () => void;
}

export const EditJobForm: FC<Props> = ({ job, onFinishEditting }) => {
	const form = useForm({
		resolver: zodResolver(NewJobFormSchema),
		defaultValues: job,
	});

	const { control, formState } = form;
	const { dirtyFields } = formState;

	const { mutate: editJob, isPending: isEdittingJob } = useEditJob();
	const onSubmit = (formData: NewJobFormData) => {
		const updatedValues = getDirtyValues(dirtyFields, formData);

		editJob(
			{ jobId: job.id, updatedValues },
			{
				onSuccess: () => {
					toast.success(`Successfully edited job, ${job.title}.`);
					onFinishEditting();
				},
				onError: (error) => {
					toast.error(`Failed to edit job, ${job.title}.`, {
						description: getErrorMessage(error),
					});
				},
			},
		);
	};

	return (
		<FormProviderWrapper form={form} onSubmit={onSubmit}>
			<FormInput control={control} path="title" label="Job Title" />

			<FormIndustryTreeSelect
				control={control}
				path="role"
				label="Role"
				userType="player"
			/>

			<FormEmploymentTypeSelect control={form.control} path="type" />

			<FormInput
				variant="textarea"
				control={control}
				path="description"
				label="Job Description"
			/>

			<FormInput control={control} path="location" label="Job Location" />

			<FormBadgeList
				control={form.control}
				path="responsibilities"
				label="Responsibilities"
				placeholder="Enter job responsibilities"
				emptyMessage="No responsibilities added yet"
			/>

			<FormBadgeList
				control={form.control}
				path="qualifications"
				label="Qualifications Required"
				placeholder="Enter required qualifications"
				emptyMessage="No qualifications added yet"
			/>

			<FormBadgeList
				control={form.control}
				path="skills"
				label="Skills Required"
				placeholder="Enter skills required"
				emptyMessage="No skills added yet"
			/>

			<FormBadgeList
				control={form.control}
				path="traits"
				label="Traits Required"
				placeholder="Enter traits required"
				emptyMessage="No traits added yet"
			/>

			<FormSingleDatePicker
				control={form.control}
				path="startDate"
				label="Start Date"
			/>

			<FormSingleDatePicker
				control={form.control}
				path="endDate"
				label="End date (optional)"
			/>

			<FormJobSalaryRange control={form.control} />

			<FormSwitchToggle
				control={form.control}
				path="openToAll"
				rightLabel="Open to All"
			/>

			<FormBadgeList
				control={form.control}
				path="tags"
				label="Tags (optional)"
				placeholder="Add tags to help find your jobs..."
				emptyMessage="No tags added yet"
			/>

			<Button
				className="ml-auto button"
				disabled={isEdittingJob}
				type="submit">
				{isEdittingJob ? <LoadingIndicator /> : "Save"}
			</Button>
		</FormProviderWrapper>
	);
};
