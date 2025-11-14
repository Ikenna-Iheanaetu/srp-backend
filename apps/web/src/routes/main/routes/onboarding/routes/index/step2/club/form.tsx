/** @format */

import { AvatarPicker } from "@/components/common/form/avatar-picker";
import { FormInput } from "@/components/common/form/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import SkipAndSaveButtons from "../../components/skip-and-submit-buttons";
import useSubmitOnboardingStep from "../../use-submit-step";
import { ClubStep2Form, ClubStep2FormScheme } from "./form-schema";

const CompanyForm: FC = () => {
	const formMethods = useForm<ClubStep2Form>({
		resolver: zodResolver(ClubStep2FormScheme),
		mode: "onChange",
	});

	const { handleSubmit, control } = formMethods;

	const { mutate, isPending: isSubmitting } = useSubmitOnboardingStep();

	const onSubmit = (data: ClubStep2Form) => {
		const keyValuePairs = Object.entries(data);
		const formData = new FormData();
		keyValuePairs.map(([key, value]) => {
			if (value instanceof File || typeof value === "string") {
				formData.append(key, value);
				return;
			}
			formData.append(key, JSON.stringify(value));
		});
		mutate(formData);
	};

	return (
		<FormProvider {...formMethods}>
			<form
				onSubmit={(event) => void handleSubmit(onSubmit)(event)}
				className="flex flex-col gap-10 w-full pr-2">
				<AvatarPicker
					control={control}
					path="banner"
					variant="banner"
				/>

				<AvatarPicker
					control={control}
					path="avatar"
					variant="avatar"
				/>

				<FormInput
					control={control}
					path="website"
					label="Your website"
					type="url"
					placeholder="https://www.example.com"
				/>

				<FormInput
					control={control}
					path="socials.facebook"
					label="Facebook"
					type="url"
					placeholder="https://facebook.com/your-page"
				/>

				<FormInput
					control={control}
					path="socials.instagram"
					label="Instagram"
					type="url"
					placeholder="https://instagram.com/your-page"
				/>

				<FormInput
					control={control}
					path="socials.twitter"
					label="Twitter (X)"
					type="url"
					placeholder="https://twitter.com/your-page"
					className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500"
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

export default CompanyForm;
