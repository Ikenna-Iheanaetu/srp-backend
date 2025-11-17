/** @format */

import { FormSecurityQuestionField } from "@/components/common/form/security-question";
import { FormProviderWrapper } from "@/components/common/form/wrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import SkipAndSaveButtons from "../../components/skip-and-submit-buttons";
import useSubmitOnboardingStep from "../../use-submit-step";
import { ClubStep3Form, ClubStep3FormSchema } from "./form-schema";

const CompanyForm: FC = () => {
	const form = useForm<ClubStep3Form>({
		resolver: zodResolver(ClubStep3FormSchema),
	});

	const { mutate, isPending: isSubmitting } = useSubmitOnboardingStep();

	const onSubmit = (data: ClubStep3Form) => {
		const keyValuePairs = Object.entries(data);
		const formData = new FormData();
		keyValuePairs.map(([key, value]) => {
			if (value instanceof File) {
				formData.append(key, value);
			}
			formData.append(key, JSON.stringify(value));
		});
		mutate(formData);
	};

	return (
		<FormProviderWrapper form={form} onSubmit={onSubmit}>
			<FormSecurityQuestionField
				control={form.control}
				path="securityQuestion"
			/>

			<SkipAndSaveButtons saveBtnProps={{ isSubmitting }} />
		</FormProviderWrapper>
	);
};

export default CompanyForm;
