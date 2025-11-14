/** @format */

import { AvatarPicker } from "@/components/common/form/avatar-picker";
import { FormBadgeList } from "@/components/common/form/badge-list-field";
import {
	FormFileUpload,
	FormMultipleFileUpload,
} from "@/components/common/form/file-upload";
import FormCountrySelect from "@/components/common/form/form-countries-select";
import { FormInput } from "@/components/common/form/input";
import FormSwitchToggle from "@/components/common/form/switch-toggle";
import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import { MultiOptionsSelect } from "@/components/common/multi-options-select";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import REGIONS from "@/data/regions.json";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { appendFilesToFormData } from "@/lib/helper-functions/file-helpers";
import {
	getDirtyValues,
	normalizeFileFields,
} from "@/lib/helper-functions/forms";
import { PreferredJobRoleSection } from "@/routes/main/routes/onboarding/routes/index/step2/player/components/role-section";
import { EmploymentTypesSection } from "@/routes/main/routes/onboarding/routes/index/step2/player/employment-types-section";
import { PLAYER_MAX_WORK_LOCATIONS } from "@/routes/main/routes/onboarding/routes/index/step2/player/form-schema";
import { profileQueries } from "@/routes/main/routes/profile/query-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormWorkExperiencesSection } from "../../../../../../../components/common/form/work-experience-section";
import OnWindowFormActionButtons from "../../../on-window-form-action-buttons";
import { useSubmitProfileSettings } from "../use-submit-profile-settings";
import {
	PlayerProfileSettingsForm,
	PlayerProfileSettingsFormSchema,
} from "./form-schema";

const PlayerProfileSettings: FC = () => {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: ["player", "supporter"],
	});
	const { data: profile } = useQuery(
		profileQueries.byUserType(cookies.userType),
	);

	const formMethods = useForm({
		resolver: zodResolver(PlayerProfileSettingsFormSchema),
		values: profile,
	});

	const {
		control,
		formState: { dirtyFields },
	} = formMethods;

	const { mutate, isPending: isSubmitting } = useSubmitProfileSettings();

	const onSubmit = (data: PlayerProfileSettingsForm) => {
		const formData = new FormData();
		const updatedValues = getDirtyValues(dirtyFields, data);
		const formatted = normalizeFileFields(updatedValues, [
			"avatar",
			"resume",
		]);

		const transformedData = appendFilesToFormData({
			formData,
			obj: formatted,
			key: "certifications",
		});

		const keyValuePairs = Object.entries(transformedData);

		const NUMBER_KEYS_TO_HANDLE = [
			"yearsOfExperience",
			"birthYear",
			"shirtNumber",
		] satisfies (keyof PlayerProfileSettingsForm)[];

		keyValuePairs.forEach(([key, value]) => {
			const isNumberKeyToHandle = NUMBER_KEYS_TO_HANDLE.some(
				(k) => k === key,
			);
			if (isNumberKeyToHandle && value === undefined) {
				return;
			}

			if (value instanceof File || typeof value === "string") {
				formData.append(key, value);
				return;
			}
			formData.append(key, JSON.stringify(value));
		});

		mutate(formData);
	};

	const navigate = useNavigate();

	return (
		<FormProviderWrapper form={formMethods} onSubmit={onSubmit}>
			<AvatarPicker control={control} path={"avatar"} />

			<div className="flex flex-col-reverse gap-8 md:flex-row">
				<div className="flex-1 space-y-8">
					<FormCountrySelect
						control={control}
						path="country"
						label="Your country"
					/>

					<FormInput
						label="Your address"
						control={control}
						path="address"
					/>

					<FormFieldErrorAndLabelWrapper
						control={control}
						path="workAvailability"
						label="Are you available for work?">
						<FormSwitchToggle
							control={control}
							path="workAvailability"
							rightLabel="Available for Work"
						/>
					</FormFieldErrorAndLabelWrapper>

					<FormField
						control={control}
						name={"workLocations"}
						render={({ field }) => (
							<FormFieldErrorAndLabelWrapper
								control={control}
								path={"workLocations"}
								label={"Work Regions"}
								showError={true}>
								<FormItem>
									<FormControl>
										<MultiOptionsSelect
											options={REGIONS.map((value) => ({
												value,
												label: value,
											}))}
											selectedOptions={field.value?.map(
												(value) => ({
													value,
													label: value,
												}),
											)}
											onChange={(newOptions) => {
												field.onChange(
													newOptions.map(
														(option) =>
															option.value,
													),
												);
											}}
											maxSelections={
												PLAYER_MAX_WORK_LOCATIONS
											}
											searchInputPlaceholder="Search regions"
											addButtonText="Add region"
											filteredLabel="Filtered regions"
											selectedLabel="Selected regions"
										/>
									</FormControl>
								</FormItem>
							</FormFieldErrorAndLabelWrapper>
						)}
					/>

					<FormInput
						label="About"
						control={control}
						path="about"
						variant="textarea"
					/>

					<FormInput
						control={control}
						path="sportsHistory"
						label="Sports History"
						variant="textarea"
					/>

					<FormInput
						control={control}
						path="birthYear"
						label="Year of birth"
					/>

					<FormInput
						control={control}
						path="shirtNumber"
						label="Your Shirt number"
						type="number"
						placeholder="Enter your shirt number"
					/>

					<FormBadgeList
						control={control}
						path="skills"
						label="Skills - (For exmapel excel, driving license)"
					/>

					<FormBadgeList
						control={control}
						path="traits"
						label="Traits"
					/>

					<FormInput
						label="Years of Experience"
						control={control}
						path="yearsOfExperience"
					/>

					<EmploymentTypesSection />

					<PreferredJobRoleSection />

					<FormFileUpload
						control={control}
						path="resume"
						label="Edit CV"
					/>

					<FormMultipleFileUpload
						control={control}
						path="certifications"
						label="Certificates"
					/>

					<FormWorkExperiencesSection
						control={control}
						path="experiences"
					/>
				</div>

				<Button
					type="button"
					onClick={() => void navigate(-1)}
					className="w-fit self-end button md:self-auto">
					Cancel
				</Button>
			</div>

			<OnWindowFormActionButtons
				submitBtnProps={{
					isSubmitting,
				}}
			/>
		</FormProviderWrapper>
	);
};

export default PlayerProfileSettings;
