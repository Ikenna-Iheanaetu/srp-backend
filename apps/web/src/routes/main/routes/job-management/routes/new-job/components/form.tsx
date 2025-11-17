/** @format */

import { FormBadgeList } from "@/components/common/form/badge-list-field";
import { FormSingleDatePicker } from "@/components/common/form/date-picker";
import { FormEmploymentTypeSelect } from "@/components/common/form/employment-types-select";
import { FormIndustryTreeSelect } from "@/components/common/form/industries-tree-select";
import { FormInput } from "@/components/common/form/input";
import FormSwitchToggle from "@/components/common/form/switch-toggle";
import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import LoadingIndicator from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { Control, SubmitHandler, useForm } from "react-hook-form";
import { href, useNavigate } from "react-router";
import { toast } from "sonner";
import { FormCurrencyPicker } from "@/components/common/form/currencies-picker";
import {
	NewJobFormData,
	NewJobFormDataInput,
	NewJobFormSchema,
} from "../form-schema";

interface SaveNewJobAsDraftRequestBody extends NewJobFormData {
	status: "drafted";
}

const useSaveAsDraft = () => {
	const navigate = useNavigate();
	return useMutation({
		mutationFn: async (job: NewJobFormData) => {
			await apiAxiosInstance.post("/jobs", {
				...job,
				status: "drafted",
			} satisfies SaveNewJobAsDraftRequestBody);
		},
		onSuccess: async (_, job) => {
			toast.success(`Successfully saved job, ${job.title}, as draft.`);
			// TODO: Confirm this path is correct when the route has been implemented
			await navigate(href("/job-management/drafts"));
		},
		onError: (error, job) => {
			toast.error(`Error occurred saving job, ${job.title}, as draft.`, {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface FormJobSalaryRangeProps {
	control: Control<NewJobFormDataInput>;
	className?: string;
}
export const FormJobSalaryRange: React.FC<FormJobSalaryRangeProps> = ({
	control,
	className,
}) => {
	return (
		<FormFieldErrorAndLabelWrapper
			control={control}
			path="salary"
			showError={false}
			label="Salary"
			className={cn(className)}>
			<div className={cn("flex flex-col gap-4 sm:flex-row")}>
				<FormInput
					control={control}
					type="number"
					path="salary.min"
					label={<span className="text-xs">Min</span>}
				/>

				<FormInput
					control={control}
					type="number"
					path="salary.max"
					label={<span className="text-xs">Max</span>}
				/>

				<FormCurrencyPicker
					control={control}
					path="salary.currency"
					label={<span className="text-xs">Currency</span>}
				/>
			</div>
		</FormFieldErrorAndLabelWrapper>
	);
};

interface NewJobFormProps {
	onPreview: (data: NewJobFormData) => void;
	existingJobdata: NewJobFormData | undefined;
}

export const NewJobForm: React.FC<NewJobFormProps> = ({
	onPreview,
	existingJobdata,
}) => {
	const form = useForm({
		resolver: zodResolver(NewJobFormSchema),
		defaultValues: existingJobdata,
		mode: "onBlur",
	});

	const { control } = form;

	const { mutate: saveAsDraft, isPending: isSavingAsDraft } =
		useSaveAsDraft();

	return (
		<div className="container space-y-8 py-2 md:max-w-2xl">
			<div className="mb-2">
				<h1 className="text-xl font-bold">Post a Job</h1>
				<p className="text-muted-foreground">
					Start posting new jobs below
				</p>
			</div>

			<FormProviderWrapper
				form={form}
				onSubmit={onPreview}
				className={cn("space-y-8")}>
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

				<FormInput
					control={control}
					path="location"
					label="Job Location"
				/>

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
					label="Start date"
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

				<div className="flex items-center justify-end gap-2 border-t pt-5">
					<Button
						type="button"
						variant="outline"
						disabled={isSavingAsDraft}
						onClick={() => {
							form.handleSubmit(
								saveAsDraft as SubmitHandler<NewJobFormData>,
							)().catch(console.error);
						}}>
						{isSavingAsDraft ? (
							<>
								Saving <LoadingIndicator />
							</>
						) : (
							"Save as draft"
						)}
					</Button>

					<Button className="button" type="submit">
						Preview
					</Button>
				</div>
			</FormProviderWrapper>
		</div>
	);
};
