/** @format */

import { FormIndustryTreeSelect } from "@/components/common/form/industries-tree-select";
import { FormRegionsSelect } from "@/components/common/form/regions-select";
import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import SkipAndSaveButtons from "../../components/skip-and-submit-buttons";
import useSubmitOnboardingStep from "../../use-submit-step";
import {
	COMPANY_SECONDARY_REGIONS_MAX,
	CompanyStep1Form,
	CompanyStep1Schema,
} from "./form-schema";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { MultiStringSelect } from "@/components/common/multi-string-select";
import REGIONS from "@/data/regions.json";
import { AvatarPicker } from "@/components/common/form/avatar-picker";
import { SecondaryAvatarPicker } from "./secondary-avatar";

const CompanyStep1: FC = () => {
	const formMethods = useForm<CompanyStep1Form>({
		resolver: zodResolver(CompanyStep1Schema),
	});

	const { handleSubmit, control, register } = formMethods;
	const { mutate, isPending: isSubmitting } = useSubmitOnboardingStep();

	const onSubmit = (data: CompanyStep1Form) => {
		const formData = new FormData();
		const fieldsArray = Object.entries(data);

		fieldsArray.forEach(([field, value]) => {
			if (typeof value === "string" || value instanceof File) {
				formData.append(field, value);
				return;
			}
			formData.append(field, JSON.stringify(value));
		});

		mutate(formData);
	};

	return (
		<FormProvider {...formMethods}>
			<form
				onSubmit={(event) => void handleSubmit(onSubmit)(event)}
				className="flex flex-col gap-10 pr-2">
				<AvatarPicker control={control} path="avatar" label="Avatar" />

				<SecondaryAvatarPicker
					control={control}
					path="secondaryAvatar"
					label="Secondary Avatar"
				/>

				<FormIndustryTreeSelect
					control={control}
					path="industry"
					label="Industry"
				/>

				<FormFieldErrorAndLabelWrapper
					control={control}
					path="about"
					label="About">
					<Textarea
						{...register("about")}
						id="about"
						placeholder="Tell us about your company..."
					/>
				</FormFieldErrorAndLabelWrapper>

				<FormFieldErrorAndLabelWrapper
					control={control}
					path="address"
					label="Company Address">
					<Input
						{...register("address")}
						id="address"
						type="text"
						placeholder="Enter your company address"
					/>
				</FormFieldErrorAndLabelWrapper>

				<div className="space-y-2">
					<FormRegionsSelect
						control={control}
						path="region.primary"
						label="Primary Region"
					/>

					<FormField
						control={control}
						name={"region.secondary"}
						render={({ field }) => (
							<FormFieldErrorAndLabelWrapper
								control={control}
								path={"region.secondary"}
								label={"Secondary Regions"}
								showError={true}>
								<FormItem>
									<FormControl>
										<MultiStringSelect
											options={REGIONS}
											selectedOptions={field.value}
											onChange={field.onChange}
											maxSelections={
												COMPANY_SECONDARY_REGIONS_MAX
											}
										/>
									</FormControl>
								</FormItem>
							</FormFieldErrorAndLabelWrapper>
						)}
					/>
				</div>

				<FormFieldErrorAndLabelWrapper
					control={control}
					path="tagline"
					label="Company Tagline">
					<Input
						{...register("tagline")}
						id="tagline"
						type="text"
						placeholder="Enter your company tagline"
					/>
				</FormFieldErrorAndLabelWrapper>

				<SkipAndSaveButtons
					saveBtnProps={{
						isSubmitting,
					}}
				/>
			</form>
		</FormProvider>
	);
};

export default CompanyStep1;
