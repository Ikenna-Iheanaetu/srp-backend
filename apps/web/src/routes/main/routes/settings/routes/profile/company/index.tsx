/** @format */

import { AvatarPicker } from "@/components/common/form/avatar-picker";
import { FormIndustryTreeSelect } from "@/components/common/form/industries-tree-select";
import { FormInput } from "@/components/common/form/input";
import { FormRegionsSelect } from "@/components/common/form/regions-select";
import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import { MultiStringSelect } from "@/components/common/multi-string-select";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import REGIONS from "@/data/regions.json";
import {
	getDirtyValues,
	normalizeFileFields,
} from "@/lib/helper-functions/forms";
import { profileQueries } from "@/routes/main/routes/profile/query-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { SecondaryAvatarPicker } from "../../../../onboarding/routes/index/step1/company/secondary-avatar";
import OnWindowFormActionButtons from "../../../on-window-form-action-buttons";
import { useSubmitProfileSettings } from "../use-submit-profile-settings";
import {
	COMPANY_SECONDARY_REGIONS_MAX,
	CompanyProfileSettingsForm,
	CompanyProfileSettingsSchema,
} from "./form-schema";

const CompanyProfileSettings: FC = () => {
	const { data: profile } = useQuery(profileQueries.byUserType("company"));
	const formMethods = useForm<CompanyProfileSettingsForm>({
		resolver: zodResolver(CompanyProfileSettingsSchema),
		// don't spread the profile data into this. the backend includes fields that causes errors.
		values: {
			avatar: profile?.avatar,
			name: profile?.name,
			tagline: profile?.tagline,
			industry: profile?.industry,
			about: profile?.about,
			focus: profile?.focus,
			country: profile?.country,
			region: profile?.region,
			address: profile?.address,
			secondaryAvatar: profile?.secondaryAvatar,
		} satisfies HasKeysOf<CompanyProfileSettingsForm>,
	});

	const { formState, register, control } = formMethods;

	const { errors, dirtyFields } = formState;

	const { mutate, isPending: isSubmitting } = useSubmitProfileSettings();

	const onSubmit = (data: CompanyProfileSettingsForm) => {
		const formData = new FormData();

		const updatedFields = getDirtyValues(dirtyFields, data);

		const formatted = normalizeFileFields(updatedFields, [
			"avatar",
			"secondaryAvatar",
		]);

		Object.entries(formatted).forEach(([key, value]) => {
			if (value instanceof File || typeof value === "string") {
				formData.append(key, value);
				return;
			}
			formData.append(key, JSON.stringify(value));
		});

		mutate(formData);
	};

	return (
		<div>
			<FormProviderWrapper
				form={formMethods}
				onSubmit={onSubmit}
				className="space-y-12 [&_input]:bg-gray-100 [&_textarea]:bg-gray-100">
				<AvatarPicker control={control} path="avatar" label="Avatar" />

				<SecondaryAvatarPicker
					control={control}
					path="secondaryAvatar"
					label="Secondary Avatar"
				/>

				<div className="flex flex-col gap-12 *:relative *:flex *:flex-col *:gap-2 sm:*:w-[min(80%,800px)] [&>*:first-child]:mb-16">
					<div>
						<Label htmlFor="name">Name</Label>
						<Input
							{...register("name")}
							type="text"
							className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
						/>
						{errors.name && (
							<p className="form-error">{errors.name.message}</p>
						)}
					</div>

					<FormIndustryTreeSelect control={control} path="industry" />

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

					<div>
						<Label htmlFor="tagLine">Tagline</Label>
						<Input
							{...register("tagline")}
							type="text"
							className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
						/>
						{errors.tagline && (
							<p className="form-error">
								{errors.tagline.message}
							</p>
						)}
					</div>

					<FormInput
						control={control}
						path="address"
						label="Your Company Address"
					/>

					<div>
						<Label htmlFor="about">About</Label>
						<Textarea
							{...register("about")}
							rows={5}
							className="tw-scrollbar"
						/>
						{errors.about && (
							<p className="form-error">{errors.about.message}</p>
						)}
					</div>

					{/* form action buttons */}
					<OnWindowFormActionButtons
						submitBtnProps={{ isSubmitting }}
					/>
				</div>
			</FormProviderWrapper>
			<div className="mt-8 flex flex-col items-center justify-between gap-4">
				<span className="font-medium">Hidden elements</span>
				<img
					src="/assets/images/settings/stripped-slanted-bars.svg"
					alt="An illustration showing hidden sections"
				/>
			</div>
		</div>
	);
};

export default CompanyProfileSettings;
