/** @format */

import {
	FormInputOTP,
	FormInputOTPSlot as OTPSlot,
} from "@/components/common/form/form-input-otp";
import LoadingIndicator from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { InputOTPGroup } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { AUTH_INPUT_STYLES } from "@/routes/auth/constants";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import React, { FC } from "react";
import { useFormContext } from "react-hook-form";
import { fieldBuilders, OTP_LENGTH, OTPForm } from "./form-schema";

const FormInputOTPSlot: FC<React.ComponentProps<typeof OTPSlot>> = ({
	className,
	...props
}) => (
	<OTPSlot
		{...props}
		className={cn("border-black", AUTH_INPUT_STYLES, "pr-0", className)}
	/>
);

interface OTPFieldProps {
	isOTPSent: boolean;
	isVerifyingOTP: boolean;
	isSendingOTP: boolean;
	onVerifyOTP: () => void;
}
export const OTPField: FC<OTPFieldProps> = ({
	isOTPSent,
	isVerifyingOTP: isSubmittingForm,
	isSendingOTP,
	onVerifyOTP,
}) => {
	const form = useFormContext<OTPForm>();
	const { path, label } = fieldBuilders[1];
	const {
		watch,
		formState: { errors },
	} = form;

	const isInputDirty = !!watch("otp");
	const isInputValid = !errors[path] && isInputDirty;

	const isDisabled = !isOTPSent || isSubmittingForm || isSendingOTP;
	const isBtnDisabled = isDisabled || !isInputValid;

	return (
		<FormInputOTP
			control={form.control}
			path={path}
			label={label}
			maxLength={OTP_LENGTH}
			disabled={isDisabled}
			pattern={REGEXP_ONLY_DIGITS}
			onComplete={onVerifyOTP}
			containerClassName="flex-col sm:flex-row items-stretch sm:items-center">
			<InputOTPGroup>
				{Array.from({ length: OTP_LENGTH }, (_, index) => (
					<FormInputOTPSlot key={index} index={index} />
				))}
			</InputOTPGroup>

			<Button
				disabled={isBtnDisabled}
				type="button"
				onClick={onVerifyOTP}
				className="button relative z-10 pointer-events-auto disabled:!opacity-100">
				{isSubmittingForm ? (
					<>
						Submitting... <LoadingIndicator />
					</>
				) : (
					"Submit"
				)}
			</Button>
		</FormInputOTP>
	);
};
