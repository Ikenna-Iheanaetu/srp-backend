/** @format */

import { FormSecurityQuestionField } from "@/components/common/form/security-question";
import { FormProviderWrapper } from "@/components/common/form/wrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import SkipAndSaveButtons from "../../components/skip-and-submit-buttons";
import useSubmitOnboardingStep from "../../use-submit-step";
import { PlayerStep4FormSchema, PlayerStep4FormValues } from "./form-schema";

const PlayerStep4Form: FC = () => {
	const form = useForm<PlayerStep4FormValues>({
		resolver: zodResolver(PlayerStep4FormSchema),
	});

	const { mutate, isPending: isSubmitting } = useSubmitOnboardingStep();

	const onSubmit = (data: PlayerStep4FormValues) => {
		const formData = new FormData();
		const keyValuePairs = Object.entries(data);
		for (const [key, value] of keyValuePairs) {
			formData.append(key, JSON.stringify(value));
		}

		mutate(formData);
	};

	return (
		<FormProviderWrapper form={form} onSubmit={onSubmit}>
			<FormSecurityQuestionField
				control={form.control}
				path="securityQuestion"
			/>

			<SkipAndSaveButtons
				saveBtnProps={{
					isSubmitting,
					disabled: !form.formState.isDirty,
				}}
			/>
		</FormProviderWrapper>
	);
};

export default PlayerStep4Form;
