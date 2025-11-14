/** @format */

import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import LoadingIndicator from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { href, useNavigate } from "react-router";
import { PasswordInput } from "../../../../../../components/common/password-input";
import { OTPForm } from "../otp-form/form-schema";
import { useBlockNavigation } from "../use-block-navigation";
import {
	fieldBuilders,
	ResetPasswordForm,
	ResetPasswordSchema,
} from "./form-schema";
import { useSubmitForm } from "./use-submit-form";

interface Props {
	OTPForm: OTPForm;
}

export const ResetPasswordFormMapper: FC<Props> = ({ OTPForm }) => {
	const form = useForm<ResetPasswordForm>({
		resolver: zodResolver(ResetPasswordSchema),
		mode: "onChange",
	});

	const { formState } = form;

	const isFormDirty = formState.isDirty;
	const isFormValid = formState.isValid && isFormDirty;

	const { mutate, isPending: isSubmitting } = useSubmitForm();

	const [hasPasswordBeenReset, setHasPasswordBeenReset] = useState(false);
	useBlockNavigation(
		hasPasswordBeenReset ? false : isFormDirty,
		"Password reset is still pending. Are you sure you want to leave?"
	);

	const navigate = useNavigate();

	return (
		<FormProviderWrapper
			form={form}
			onSubmit={(values) =>
				mutate(
					{ ...OTPForm, ...values },
					{
						onSuccess: () => {
							// wait till useBlockNavigation is aware that hasPasswordBeenReset is true before redirecting
							flushSync(() => setHasPasswordBeenReset(true));
							void navigate(href("/login"), { replace: true });
						},
					}
				)
			}>
			{fieldBuilders.map(({ path, label, placeholder }) => (
				<FormFieldErrorAndLabelWrapper
					key={path}
					control={form.control}
					path={path}
					label={label}>
					<PasswordInput
						{...form.register(path)}
						placeholder={placeholder}
					/>
				</FormFieldErrorAndLabelWrapper>
			))}

			<Button
				className="button w-full"
				disabled={!isFormValid || isSubmitting}>
				{isSubmitting ? (
					<>
						Submitting <LoadingIndicator />
					</>
				) : (
					"Reset password"
				)}
			</Button>
		</FormProviderWrapper>
	);
};
