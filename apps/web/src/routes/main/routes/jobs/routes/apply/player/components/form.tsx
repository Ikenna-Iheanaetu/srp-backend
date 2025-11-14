/** @format */

import { FormInput } from "@/components/common/form/input";
import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button, ButtonProps } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { href, Link } from "react-router";
import { FormFileUpload } from "../../../../../../../../components/common/form/file-upload";
import FormSwitchToggle from "../../../../../../../../components/common/form/switch-toggle";
import { JobApplicationForm, jobApplicationFormSchema } from "../form-schema";
import { useSubmitJobApplication } from "../use-submit-application";

type CancelBtnProps = Pick<ButtonProps, "className" | "variant" | "children">;

const CancelBtn: FC<CancelBtnProps> = ({ className, variant, children }) => {
	return (
		<Button
			asChild
			variant={variant}
			className={cn("cancel-btn", className)}>
			<Link to={href("/jobs/search")}>{children ?? "Cancel"}</Link>
		</Button>
	);
};

const PlayerJobApplicationForm: FC = () => {
	const formMethods = useForm({
		resolver: zodResolver(jobApplicationFormSchema),
	});
	const { handleSubmit, control, register, watch } = formMethods;

	const { mutate, isPending: isSubmitting } = useSubmitJobApplication();

	const onSubmit = useCallback(
		(data: JobApplicationForm) => {
			const keyValue = Object.entries(data);
			const formData = new FormData();
			keyValue.map(([key, value]) => {
				// TODO: remove this check
				if (
					["applicationletter", "isinfoaccurate"].includes(
						key.toLowerCase(),
					)
				)
					return;

				if (value instanceof File || typeof value === "string") {
					formData.append(key, value);
					return;
				}

				formData.append(key, JSON.stringify(value));
			});

			mutate(formData);
		},
		[mutate],
	);

	const isInfoAccurate = watch("isInfoAccurate");

	return (
		<FormProvider {...formMethods}>
			<form
				onSubmit={(event) => void handleSubmit(onSubmit)(event)}
				className="flex flex-col gap-8">
				<CancelBtn className="self-end button" />

				<FormInput control={control} path="name" label="Full Name" />

				<FormInput
					control={control}
					path="email"
					label="Email"
					type="email"
				/>

				<div className="mb-6 grid grid-cols-5 gap-4">
					<FormFieldErrorAndLabelWrapper
						control={control}
						path="zip"
						label={"Zip Code"}>
						<Input
							id="zip"
							type="tel"
							{...register("zip", { min: 0 })}
						/>
					</FormFieldErrorAndLabelWrapper>

					<FormFieldErrorAndLabelWrapper
						control={control}
						path="phone"
						label={"Contact Number"}
						className="col-span-4">
						<Input
							id="phone"
							type="tel"
							{...register("phone", { min: 0 })}
						/>
					</FormFieldErrorAndLabelWrapper>
				</div>

				<FormFileUpload
					control={control}
					path="resume"
					label="Upload CV"
				/>

				<FormFileUpload
					control={control}
					path="applicationLetter"
					label="Upload Cover Letter - optional"
				/>

				<FormFieldErrorAndLabelWrapper
					control={control}
					path="legallyAuthorized"
					label="Are you legally authorized to work in this country ?">
					<FormSwitchToggle
						control={control}
						path="legallyAuthorized"
						leftLabel="No"
						rightLabel="Yes"
					/>
				</FormFieldErrorAndLabelWrapper>

				<FormFieldErrorAndLabelWrapper
					control={control}
					path="visaSponsorship"
					label="Do you require visa sponsorship?">
					<FormSwitchToggle
						control={control}
						path="visaSponsorship"
						leftLabel="No"
						rightLabel="Yes"
					/>
				</FormFieldErrorAndLabelWrapper>

				<FormInput
					control={control}
					path="yearsOfExperience"
					label="Years of Experience"
					type="number"
				/>

				<FormField
					control={control}
					name="isInfoAccurate"
					render={({ field }) => (
						<FormItem className="flex items-center gap-2">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
									className="data-[state=checked]:border-none data-[state=checked]:bg-blue-700 [&_svg]:stroke-white"
								/>
							</FormControl>

							<FormLabel>
								I confirm that the information provided is true
								and accurate
							</FormLabel>
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-4">
					<CancelBtn variant={"outline"} className="px-8" />

					<Button
						className={"button"}
						type="submit"
						disabled={!isInfoAccurate || isSubmitting}>
						{isSubmitting ? <LoadingIndicator /> : "Submit"}
					</Button>
				</div>
			</form>
		</FormProvider>
	);
};

export default PlayerJobApplicationForm;
