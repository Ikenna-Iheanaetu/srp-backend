/** @format */

import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import { MultiOptionsSelect } from "@/components/common/multi-options-select";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import REGIONS from "@/data/regions.json";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import SkipAndSaveButtons from "../../components/skip-and-submit-buttons";
import useSubmitOnboardingStep from "../../use-submit-step";
import { PreferredJobRoleSection } from "./components/role-section";
import { EmploymentTypesSection } from "./employment-types-section";
import {
	PLAYER_MAX_WORK_LOCATIONS,
	PlayerStep2FormSchema,
	PlayerStep2FormValues,
} from "./form-schema";

const PlayerStep2Form: FC = () => {
	const form = useForm({
		resolver: zodResolver(PlayerStep2FormSchema),
	});

	const {
		control,
		formState: { isDirty },
	} = form;

	const { mutate, isPending: isSubmitting } = useSubmitOnboardingStep();

	const onSubmit = (data: PlayerStep2FormValues) => {
		const formData = new FormData();
		const fieldsArray = Object.entries(data);
		fieldsArray.forEach(([field, value]) => {
			if (value instanceof File) {
				formData.append(field, value);
				return;
			}
			formData.append(field, JSON.stringify(value));
		});

		mutate(formData);
	};

	return (
		<FormProviderWrapper form={form} onSubmit={onSubmit}>
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
												(option) => option.value,
											),
										);
									}}
									maxSelections={PLAYER_MAX_WORK_LOCATIONS}
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

			<EmploymentTypesSection />

			<PreferredJobRoleSection />

			<SkipAndSaveButtons
				saveBtnProps={{
					isSubmitting,
					disabled: !isDirty,
				}}
			/>
		</FormProviderWrapper>
	);
};

export default PlayerStep2Form;
