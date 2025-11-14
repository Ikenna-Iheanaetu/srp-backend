/** @format */

import {
	CardContent,
	CardDescription,
	CardFooter,
	CardTitle,
} from "@/components/ui/card";
import { AuthCard, AuthCardHeader } from "@/routes/auth/components/auth-card";
import { LoginDisplayLayout } from "../../login-display-layout";
import { OTPFormMapper } from "./otp-form/form";
import { useState } from "react";
import { ResetPasswordFormMapper } from "./reset-password-form/form";
import { AuthLinkButton } from "@/routes/auth/components/auth-button";
import { href } from "react-router";
import { OTPForm } from "./otp-form/form-schema";

export default function ForgotPasswordRoute() {
	const [OTPForm, setOTPForm] = useState<OTPForm>();
	const isOTPVerified = !!OTPForm;

	return (
		<LoginDisplayLayout>
			<AuthCard>
				<AuthCardHeader>
					<CardTitle>
						<h1 className="text-4xl">Forgot password?</h1>
					</CardTitle>

					<CardDescription>
						<p className="text-base">
							Please enter details to reset your password.
						</p>
					</CardDescription>
				</AuthCardHeader>

				<CardContent className="w-full box-border px-12">
					{isOTPVerified ? (
						<ResetPasswordFormMapper OTPForm={OTPForm} />
					) : (
						<OTPFormMapper onOTPVerified={setOTPForm} />
					)}
				</CardContent>

				{!isOTPVerified && (
					<CardFooter className="flex-col">
						<p>
							Remembered password?{" "}
							<AuthLinkButton to={href("/login")}>
								Login
							</AuthLinkButton>{" "}
						</p>
						<p>
							Don&apos;t have an account?{" "}
							<AuthLinkButton to={href("/signup")}>
								Sign up
							</AuthLinkButton>
						</p>
					</CardFooter>
				)}
			</AuthCard>
		</LoginDisplayLayout>
	);
}
