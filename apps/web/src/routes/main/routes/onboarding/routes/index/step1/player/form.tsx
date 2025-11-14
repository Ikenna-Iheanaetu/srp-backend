/** @format */

import { AvatarPicker } from "@/components/common/form/avatar-picker";
import FormCountrySelect from "@/components/common/form/form-countries-select";
import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { profileQueries } from "@/routes/main/routes/profile/query-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { useForm } from "react-hook-form";
import SkipAndSaveButtons from "../../components/skip-and-submit-buttons";
import useSubmitOnboardingStep from "../../use-submit-step";
import { PlayerStep1Form, PlayerStep1Schema } from "./form-schema";
import { FormInput } from "@/components/common/form/input";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";

const PlayerStep1: FC = () => {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: ["player", "supporter"],
	});
	const { data: userProfile } = useQuery(
		profileQueries.byUserType(cookies.userType),
	);

	const formMethods = useForm<PlayerStep1Form>({
		resolver: zodResolver(PlayerStep1Schema),
		values: userProfile,
	});

	const { control, register } = formMethods;

	const { mutate, isPending: isSubmitting } = useSubmitOnboardingStep();

	const onSubmit = (data: PlayerStep1Form) => {
		const formData = new FormData();
		const keyValue = Object.entries(data);

		keyValue.forEach(([field, value]) => {
			if (value instanceof File || typeof value === "string") {
				formData.append(field, value);
				return;
			}
			formData.append(field, JSON.stringify(value));
		});

		mutate(formData);
	};

	return (
		<FormProviderWrapper form={formMethods} onSubmit={onSubmit}>
			<AvatarPicker control={control} path="avatar" />

			<FormFieldErrorAndLabelWrapper
				control={control}
				path="about"
				label="About">
				<Textarea
					{...register("about")}
					id="about-input"
					placeholder="Tell us about yourself..."
				/>
			</FormFieldErrorAndLabelWrapper>

			<FormFieldErrorAndLabelWrapper
				control={control}
				path="address"
				label="Address">
				<Input
					{...register("address")}
					id="address-input"
					type="text"
					placeholder="Enter your address"
				/>
			</FormFieldErrorAndLabelWrapper>

			<FormFieldErrorAndLabelWrapper
				control={control}
				path="sportsHistory"
				label="Sports History">
				<Textarea
					{...register("sportsHistory")}
					placeholder="Enter your Sports History"
				/>
			</FormFieldErrorAndLabelWrapper>

			<div className="grid grid-cols-2 gap-4">
				<FormFieldErrorAndLabelWrapper
					control={control}
					path="birthYear"
					label="Year of birth">
					<Input
						{...register("birthYear")}
						type="number"
						placeholder="Enter your birth year"
					/>
				</FormFieldErrorAndLabelWrapper>

				<FormFieldErrorAndLabelWrapper
					control={control}
					path="shirtNumber"
					label="Your Shirt number">
					<Input
						{...register("shirtNumber")}
						type="number"
						placeholder="Enter your shirt number"
					/>
				</FormFieldErrorAndLabelWrapper>
			</div>

			<FormInput
				control={control}
				path={"yearsOfExperience"}
				type="number"
				label="Years of Experience"
			/>

			<FormCountrySelect
				control={control}
				path={"country"}
				label="Choose a country"
			/>

			<SkipAndSaveButtons
				saveBtnProps={{
					isSubmitting,
				}}
			/>
		</FormProviderWrapper>
	);
};

export default PlayerStep1;
