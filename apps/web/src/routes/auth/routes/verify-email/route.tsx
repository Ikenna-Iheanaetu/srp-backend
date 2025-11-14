/** @format */

import {
	FormInputOTP,
	FormInputOTPSlot,
} from "@/components/common/form/form-input-otp";
import { FormProviderWrapper } from "@/components/common/form/wrapper";
import LoadingIndicator from "@/components/common/loading-indicator";
import SiteLogo from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { InputOTPGroup } from "@/components/ui/input-otp";
import { DISPLAY_LAYOUT_CONTAINER_STYLES } from "@/constants";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Mail } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { InvalidVerificationParamsWarning } from "./components/invalid-params-warning";
import { RightSidebar } from "./components/right-sidebar";
import { useOTP } from "./hooks/use-otp";
import { useSendOTPMutaion } from "./hooks/use-resend-otp";
import { useVerifyEmail } from "./hooks/use-verify-email";
import {
	OTP_LENGTH,
	OTPForm,
	OTPFormSchema,
	VerifyEmailSearchParams,
} from "./schemas";

const isEmailValid = (email: unknown): email is string =>
	z.string().email().safeParse(email).success;

export default function VerifyEmail() {
	const [{ email }] = useQueryStates(VerifyEmailSearchParams);

	const {
		mutate: verifyEmail,
		isPending: isVerifyingEmail,
		failureCount: verificationFailureCount,
	} = useVerifyEmail();

	const form = useForm<OTPForm>({
		resolver: zodResolver(OTPFormSchema),
		mode: "onBlur",
	});

	const hasFailedVerification = verificationFailureCount > 0;

	const { mutate: otpMutate, isPending: isSendingOTP } = useSendOTPMutaion();

	const {
		canResend: canResendOTP,
		timeUntilResendAllowed,
		sendOTP,
		isTimerRunning,
	} = useOTP({
		onSendOTP: ({ onSuccess }) => {
			if (!isEmailValid(email)) {
				return;
			}

			otpMutate(
				{
					email,
				},
				{ onSuccess },
			);
		},
	});

	const isVerifyBtnDisabled =
		!isEmailValid(email) || isSendingOTP || isVerifyingEmail;

	const isOTPBtnDisabled =
		!isEmailValid(email) ||
		isSendingOTP ||
		isVerifyingEmail ||
		isTimerRunning;

	return (
		<div className={cn(DISPLAY_LAYOUT_CONTAINER_STYLES, "bg-gray-50")}>
			{/* Main Content */}
			<div className="flex flex-col items-center justify-center gap-4 p-4 pb-0 lg:p-8">
				<SiteLogo variant="dark" />
				<Card className="w-full max-w-lg overflow-auto border-0 shadow-lg tw-scrollbar">
					<CardHeader className="pb-4 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
							<Mail className="h-8 w-8" />
						</div>
						<CardTitle className="text-2xl font-bold text-gray-900">
							Verify Email
						</CardTitle>
						<CardDescription className="mt-2 text-base text-gray-600">
							To complete your registration and get full access to
							our services, we&apos;ll need to verify your email
							address.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6 pb-0">
						{isEmailValid(email) ? (
							<p
								className={cn(
									"rounded-lg border border-gray-200 bg-gray-50 p-4",
								)}>
								<span className="font-medium">Your email:</span>{" "}
								{email}
							</p>
						) : (
							<InvalidVerificationParamsWarning />
						)}

						<FormProviderWrapper
							form={form}
							onSubmit={({ otp }) => {
								if (isEmailValid(email)) {
									verifyEmail({ email, otp });
								}
							}}
							className="space-y-0">
							<FormInputOTP
								control={form.control}
								path={"otp"}
								label={"Enter sent OTP"}
								maxLength={OTP_LENGTH}
								disabled={isVerifyingEmail || isSendingOTP}
								pattern={REGEXP_ONLY_DIGITS}
								onComplete={() => {
									if (isEmailValid(email)) {
										void form.handleSubmit(({ otp }) =>
											verifyEmail({ email, otp }),
										)();
									}
								}}
								containerClassName="flex-col sm:flex-row items-stretch sm:items-center">
								<InputOTPGroup>
									{Array.from(
										{ length: OTP_LENGTH },
										(_, index) => (
											<FormInputOTPSlot
												key={index}
												index={index}
											/>
										),
									)}
								</InputOTPGroup>
							</FormInputOTP>
						</FormProviderWrapper>
					</CardContent>

					<CardFooter className="flex-col gap-4">
						<Button
							type="button"
							onClick={() => {
								if (isEmailValid(email)) {
									void form.handleSubmit(({ otp }) =>
										verifyEmail({ email, otp }),
									)();
								}
							}}
							disabled={isVerifyBtnDisabled}
							className={cn("w-full button")}>
							{isVerifyingEmail ? (
								<>
									<LoadingIndicator />
									Verifying...
								</>
							) : hasFailedVerification ? (
								"Retry verification"
							) : (
								"Verify email"
							)}
						</Button>

						<div className="w-full space-y-3">
							<div className="flex items-center gap-2">
								<div className="h-px flex-1 bg-gray-200"></div>
								<span className="px-2 text-sm text-gray-500">
									or
								</span>
								<div className="h-px flex-1 bg-gray-200"></div>
							</div>

							<div className="space-y-2 text-center">
								<p className="text-sm text-gray-600">
									Didn&apos;t receive the code?
								</p>
								<Button
									variant="outline"
									type="button"
									disabled={isOTPBtnDisabled}
									onClick={sendOTP}
									className="w-full bg-transparent hover:bg-gray-50">
									{(() => {
										if (isSendingOTP) {
											return (
												<>
													<LoadingIndicator />
													Sending new code...
												</>
											);
										}

										if (
											!canResendOTP &&
											timeUntilResendAllowed > 0
										) {
											return `Resend code in ${timeUntilResendAllowed}s`;
										}

										return "Resend verification code";
									})()}
								</Button>{" "}
							</div>
						</div>
					</CardFooter>
				</Card>
			</div>

			<RightSidebar />
		</div>
	);
}
