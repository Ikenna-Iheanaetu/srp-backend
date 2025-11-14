/** @format */

import { DebouncedInputNative } from "@/components/common/debounced-input";
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
import { AuthLinkButton } from "@/routes/auth/components/auth-button";
import { AuthButtonGroup } from "@/routes/auth/components/auth-button-group";
import { AuthCard, AuthCardHeader } from "@/routes/auth/components/auth-card";
import { AUTH_INPUT_STYLES } from "@/routes/auth/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Slot } from "@radix-ui/react-slot";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { href } from "react-router";
import {
	AllowedSignupUserType,
	AuthSignupForm,
	AuthSignupSchema,
	ClubReferredUserTypeSchema,
	formFieldBuilders,
} from "../form-schema";
import { useSignupSearchParams } from "../hooks/use-signup-search-params";
import useSubmitSignupForm from "../hooks/use-submit-signup-form";
import { ClubReferralBanner } from "./club-referral-banner";
import { useAffiliatingClubQuery } from "../hooks/use-affiliating-club-query";
import { ClubSelect } from "./club-select";

interface Props {
	userType: AllowedSignupUserType;
}

const AuthSignupMapper: FC<Props> = ({ userType }) => {
	const [{ refCode, wasInvited }, setSearchParams] = useSignupSearchParams();

	const form = useForm<AuthSignupForm>({
		resolver: zodResolver(AuthSignupSchema),
		values: {
			refCode: refCode ?? "",
			userType,
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		} satisfies AuthSignupForm,
	});

	const { register, control, watch } = form;

	useEffect(() => {
		// sync the refCode in the form state with the search params to be
		// also used by Google sign up
		const subscription = watch((value, { name }) => {
			if (name === "refCode") {
				void setSearchParams((prev) => ({
					...prev,
					refCode: value.refCode ?? null,
				}));
			}
		});
		return subscription.unsubscribe;
	}, [setSearchParams, watch]);

	const { mutate: submitForm, isPending: isSubmitting } =
		useSubmitSignupForm();

	const isClubAffiliatedUserType =
		ClubReferredUserTypeSchema.safeParse(userType).data;
	const { club } = useAffiliatingClubQuery();

	const canChooseAlternateClub =
		(userType === "company" || userType === "supporter") && !wasInvited;

	return (
		<AuthCard className="md:mt-8 lg:mt-0 items-stretch">
			<AuthCardHeader>
				{isClubAffiliatedUserType && <ClubReferralBanner />}

				<CardTitle>
					<h1 className="font-semibold text-4xl capitalize">
						{userType} Sign up
					</h1>
				</CardTitle>

				<CardDescription>
					<p className="truncate">
						{isClubAffiliatedUserType ? (
							<>
								Sign up to Club:{" "}
								<strong>{club?.name ?? "--"}</strong>.
							</>
						) : (
							"Sign up your club to our platform."
						)}
					</p>
				</CardDescription>
			</AuthCardHeader>

			<CardContent className="w-full">
				<FormProviderWrapper form={form} onSubmit={submitForm}>
					{canChooseAlternateClub && (
						<div className="space-y-2">
							<p>Want to choose a different club?</p>
							<ClubSelect />
						</div>
					)}

					<div className="md:gap-6 md:grid lg:block md:grid-cols-2">
						{formFieldBuilders.map(
							({ type, label, placeholder, path }) => {
								const inputProps = {
									...register(path),
									placeholder,
									type,
									className: AUTH_INPUT_STYLES,
								} satisfies React.InputHTMLAttributes<HTMLInputElement>;

								return (
									<FormFieldErrorAndLabelWrapper
										key={path}
										control={control}
										path={path}
										label={label}
										className="gap-2">
										<Slot {...inputProps}>
											{type === "password" ? (
												<PasswordInput />
											) : (
												<DebouncedInputNative />
											)}
										</Slot>
									</FormFieldErrorAndLabelWrapper>
								);
							}
						)}
					</div>

					{/* signup buttons */}
					<AuthButtonGroup
						isSubmitting={isSubmitting}
						submitText="Sign up"
						authType="signup"
					/>
				</FormProviderWrapper>
			</CardContent>

			<CardFooter>
				<p className="text-sm text-slate-600 font-medium">
					Already have an account?{" "}
					<AuthLinkButton to={href("/login")}>Log in</AuthLinkButton>
				</p>
			</CardFooter>
		</AuthCard>
	);
};

export default AuthSignupMapper;
