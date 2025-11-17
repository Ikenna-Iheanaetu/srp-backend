/** @format */

import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";
import LoadingIndicator from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AUTH_INPUT_STYLES } from "@/routes/auth/constants";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { fieldBuilders, OTPForm } from "./form-schema";

interface Props {
	isSubmittingForm: boolean;
	isSendingOTP: boolean;
	onSendOTP: (onSucess: () => void) => void;
}

export const EmailField: FC<Props> = ({
	isSubmittingForm,
	isSendingOTP,
	onSendOTP,
}) => {
	const { path, label, ...inputProps } = fieldBuilders[0];

	const [resendState, setResendState] = useState({
		canResend: false,
		timeUntilResendAllowed: 0,
		isTimerRunning: false,
	});

	const resendOTPTimeoutIDRef = useRef<NodeJS.Timeout>(undefined);
	const handleClearTimeout = useCallback(
		() => clearInterval(resendOTPTimeoutIDRef.current),
		[]
	);
	useEffect(() => handleClearTimeout(), [handleClearTimeout]);

	const form = useFormContext<OTPForm>();

	const handleSendOTP = () => {
		handleClearTimeout();
		setResendState((prev) => ({
			...prev,
			canResend: false,
		}));
		onSendOTP(() => {
			setResendState((prev) => ({
				...prev,
				canResend: false,
				isTimerRunning: true,
				timeUntilResendAllowed: 60,
			}));
			resendOTPTimeoutIDRef.current = setInterval(
				() =>
					setResendState((prevState) => {
						const cloneState = {
							...prevState,
							timeUntilResendAllowed:
								prevState.timeUntilResendAllowed - 1,
						};
						const newTime = cloneState.timeUntilResendAllowed;
						if (newTime <= 0) {
							cloneState.canResend = true;
							cloneState.isTimerRunning = false;
							handleClearTimeout();
						}
						return cloneState;
					}),
				1000
			);
		});
	};

	const {
		watch,
		formState: { errors },
	} = form;
	const isEmailDirty = !!watch("email");
	const isEmailValid = !errors[path] && isEmailDirty;

	const isBtnDisabled =
		!isEmailValid ||
		isSendingOTP ||
		resendState.isTimerRunning ||
		isSubmittingForm;

	return (
		<FormFieldErrorAndLabelWrapper
			control={form.control}
			path={path}
			label={label}
			className="flex flex-col gap-2">
			<Input
				{...inputProps}
				{...form.register(path)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						handleSendOTP();
					}
				}}
				className={cn(AUTH_INPUT_STYLES)}
			/>
			<Button
				className="button"
				type="button"
				disabled={isBtnDisabled}
				onClick={handleSendOTP}>
				{(() => {
					const {
						isTimerRunning,
						canResend,
						timeUntilResendAllowed,
					} = resendState;
					if (isSendingOTP) {
						return (
							<>
								Sending OTP... <LoadingIndicator />
							</>
						);
					}

					if (isTimerRunning) {
						return `Resend OTP in ${timeUntilResendAllowed}`;
					}

					return canResend ? "Resend OTP" : "Send OTP";
				})()}
			</Button>
		</FormFieldErrorAndLabelWrapper>
	);
};
