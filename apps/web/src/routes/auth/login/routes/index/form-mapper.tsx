/** @format */

import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import { PasswordInput } from "@/components/common/password-input";
import {
	CardContent,
	CardDescription,
	CardFooter,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AuthLinkButton } from "@/routes/auth/components/auth-button";
import { AuthButtonGroup } from "@/routes/auth/components/auth-button-group";
import { AuthCard, AuthCardHeader } from "@/routes/auth/components/auth-card";
import { AUTH_INPUT_STYLES } from "@/routes/auth/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Slot } from "@radix-ui/react-slot";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { href } from "react-router";
import { ForgotPasswordLocationState } from "../forgot-password/otp-form/form";
import { AuthLoginSchema, fieldBuilders } from "./form-schema";
import useSubmitLoginForm from "./use-submit-login-form";

export const LoginFormMapper: FC = () => {
	const formMethods = useForm({
		resolver: zodResolver(AuthLoginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const { register, control } = formMethods;

	const { mutate: onSubmit, isPending: isSubmitting } = useSubmitLoginForm();

	return (
		<AuthCard>
			<AuthCardHeader>
				<CardTitle>
					<h1 className="text-4xl font-semibold">Welcome back!</h1>
				</CardTitle>

				<CardDescription>
					<p className="text-base">Please enter you login details.</p>
				</CardDescription>
			</AuthCardHeader>

			<CardContent className="w-full">
				<FormProviderWrapper form={formMethods} onSubmit={onSubmit}>
					<div className="md:grid md:grid-cols-2 md:gap-6 lg:block">
						{fieldBuilders.map(
							({ path, type, label, placeholder }) => {
								const inputProps = {
									...register(path),
									type,
									placeholder,
									className: AUTH_INPUT_STYLES,
								};
								return (
									<FormFieldErrorAndLabelWrapper
										key={path}
										control={control}
										path={path}
										label={label}
										className={cn(
											"relative flex flex-col gap-2",
										)}>
										<Slot {...inputProps}>
											{type === "password" ? (
												<PasswordInput />
											) : (
												<Input />
											)}
										</Slot>
									</FormFieldErrorAndLabelWrapper>
								);
							},
						)}

						{/* forgot password */}
						<AuthLinkButton
							className="w-fit"
							to={href("/login/forgot-password")}
							state={
								// will be used to prefill the form in forgot password page
								{
									email: formMethods.getValues("email"),
								} satisfies ForgotPasswordLocationState
							}>
							Forgot password
						</AuthLinkButton>
					</div>

					{/* login buttons */}
					<AuthButtonGroup
						isSubmitting={isSubmitting}
						submitText="Log in"
						authType="login"
					/>
				</FormProviderWrapper>
			</CardContent>

			<CardFooter>
				<p className="text-sm text-slate-600">
					Don&apos;t have an account?{" "}
					<AuthLinkButton to={href("/signup")}>
						Sign up
					</AuthLinkButton>
				</p>
			</CardFooter>
		</AuthCard>
	);
};
