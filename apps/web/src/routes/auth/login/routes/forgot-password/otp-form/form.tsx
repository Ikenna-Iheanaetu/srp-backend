/** @format */

import { FormProviderWrapper } from "@/components/common/form/wrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router";
import { EmailField } from "./email-field";
import { OTPForm, OTPFormSchema } from "./form-schema";
import { OTPField } from "./otp-field";
import { useSendOTP } from "./use-send-otp";
import { useVerifyOTP } from "./use-verify-otp";
import { useBlockNavigation } from "../use-block-navigation";

export type ForgotPasswordLocationState = Pick<OTPForm, "email">;
const checkIsLocationState = (
	state: unknown
): state is ForgotPasswordLocationState =>
	typeof state === "object" && state !== null && "email" in state;

interface Props {
	onOTPVerified: (form: OTPForm) => void;
}

export const OTPFormMapper: FC<Props> = ({ onOTPVerified }) => {
	const location = useLocation();
	const form = useForm<OTPForm>({
		defaultValues: {
			email: checkIsLocationState(location.state)
				? location.state.email
				: undefined,
		},
		resolver: zodResolver(OTPFormSchema),
		mode: "onChange",
	});
	const [isOTPSent, setIsOTPSent] = useState(false);
	useBlockNavigation(
		isOTPSent,
		"OTP Verification is still pending. Are you sure you want to leave?"
	);

	const { mutate: verifyOTP, isPending: isVerifyingOTP } = useVerifyOTP();

	const { mutate: sendOTP, isPending: isSendingOTP } = useSendOTP();

	return (
		<FormProviderWrapper form={form} onSubmit={verifyOTP}>
			<EmailField
				isSubmittingForm={isVerifyingOTP}
				isSendingOTP={isSendingOTP}
				onSendOTP={(onSuccess) =>
					sendOTP(
						{ email: form.getValues("email") },
						{
							onSuccess: () => {
								onSuccess();
								setIsOTPSent(true);
							},
						}
					)
				}
			/>

			<OTPField
				isOTPSent={isOTPSent}
				isVerifyingOTP={isVerifyingOTP}
				isSendingOTP={isSendingOTP}
				onVerifyOTP={() =>
					verifyOTP(form.getValues(), {
						onSuccess: (_data, variables) =>
							onOTPVerified(variables),
					})
				}
			/>
		</FormProviderWrapper>
	);
};
