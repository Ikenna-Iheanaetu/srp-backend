/** @format */

import { Label } from "@/components/ui/label";
import { moveToNextInputFieldOnEnter } from "@/lib/helper-functions";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import OnWindowFormActionButtons from "../../on-window-form-action-buttons";
import {
	PasswordChangeForm,
	PasswordChangeSchema,
} from "../../utils/password-schema";
import { SecurityQestionSelector } from "./choose-security-question";
import PassWordInputWithVisibility from "./password-input-with-visibility";
import { useSubmitPasswordChangeForm } from "./use-submit-password-change";

const PasswordSettingsMapper: FC = () => {
	const formMethods = useForm<PasswordChangeForm>({
		resolver: zodResolver(PasswordChangeSchema),
		defaultValues: {
			oldPassword: "",
			newPassword: "",
			confirmNewPassword: "",
			securityQuestion: {
				question: "",
				answer: "",
			},
		},
		mode: "onBlur",
	});

	const { handleSubmit, formState, register } = formMethods;

	const { errors } = formState;

	const { mutate, isPending: isSubmitting } = useSubmitPasswordChangeForm();

	const onSubmit = useCallback(
		(data: PasswordChangeForm) => {
			mutate({
				oldPassword: data.oldPassword,
				newPassword: data.newPassword,
				securityQuestion: data.securityQuestion,
			});
		},
		[mutate],
	);

	return (
		<FormProvider {...formMethods}>
			<form
				onSubmit={(event) => void handleSubmit(onSubmit)(event)}
				onKeyDown={(event) =>
					moveToNextInputFieldOnEnter(
						event as unknown as KeyboardEvent,
					)
				}
				className="flex flex-col gap-8">
				<div className="relative">
					<Label htmlFor="oldPassword">Old Password</Label>
					<PassWordInputWithVisibility {...register("oldPassword")} />
					<p className="form-error">{errors.oldPassword?.message}</p>
				</div>

				<div className="relative">
					<Label htmlFor="newPassword">New Password</Label>
					<PassWordInputWithVisibility {...register("newPassword")} />
					<p className="form-error">{errors.newPassword?.message}</p>
				</div>

				<div className="relative">
					<Label htmlFor="confirmNewPassword">
						Confirm New Password
					</Label>
					<PassWordInputWithVisibility
						{...register("confirmNewPassword")}
					/>
					<p className="form-error">
						{errors.confirmNewPassword?.message}
					</p>
				</div>

				<SecurityQestionSelector />

				<OnWindowFormActionButtons
					submitBtnProps={{
						isSubmitting,
					}}
				/>
			</form>
		</FormProvider>
	);
};

export default PasswordSettingsMapper;
