/** @format */

import { FormColorInput } from "@/components/common/form/color-input";
import { FormInput } from "@/components/common/form/input";
import { FormRegionsSelect } from "@/components/common/form/regions-select";
import { FormSportsCategorySelect } from "@/components/common/form/sports-category-select";
import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import SkipAndSaveButtons from "../../components/skip-and-submit-buttons";
import useSubmitOnboardingStep from "../../use-submit-step";
import { ClubAddressSectioin } from "./address-section";
import { ClubStep1Form, ClubStep1Schema } from "./form-schema";

const ClubStep1: FC = () => {
	const formMethods = useForm({
		resolver: zodResolver(ClubStep1Schema),
		mode: "onChange",
	});

	const { handleSubmit, control, register, formState } = formMethods;
	const { isSubmitting } = formState;
	const { mutateAsync } = useSubmitOnboardingStep();

	const onSubmit = async (data: ClubStep1Form) => {
		const formData = new FormData();
		const fieldsArray = Object.entries(data);

		fieldsArray.forEach(([field, value]) => {
			if (value instanceof File || typeof value === "string") {
				formData.append(field, value);
				return;
			}
			if (value !== undefined && value !== null) {
				formData.append(field, JSON.stringify(value));
			}
		});

		await mutateAsync(formData);
	};

	return (
		<FormProvider {...formMethods}>
			<form
				onSubmit={(event) => void handleSubmit(onSubmit)(event)}
				className="flex flex-col gap-10 pr-2">
				<FormSportsCategorySelect control={control} path="category" />

				<FormFieldErrorAndLabelWrapper
					control={control}
					path="about"
					label="Club History">
					<Textarea
						{...register("about")}
						placeholder="Provide a brief history of the club"
					/>
				</FormFieldErrorAndLabelWrapper>

				<ClubAddressSectioin />

				<FormInput
					control={control}
					path="phone"
					label="Phone Number"
				/>

				<FormRegionsSelect
					control={control}
					path="region"
					label="Region"
				/>

				<FormColorInput
					control={control}
					path="preferredColor"
					label="Preferred Color"
				/>

				<SkipAndSaveButtons
					saveBtnProps={{
						isSubmitting,
					}}
				/>
			</form>
		</FormProvider>
	);
};

export default ClubStep1;
