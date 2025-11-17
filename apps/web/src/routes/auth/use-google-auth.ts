/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { UserType } from "@/lib/schemas/user";
import { getErrorMessage } from "@/lib/utils";
import { CredentialResponse } from "@react-oauth/google";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { handleAuthLoginSuccess } from "./login/routes/index/use-submit-login-form";
import {
	AllowedSignupUserType,
	AuthSignupForm,
} from "./signup/routes/signup-form/form-schema";
import { useSignupSearchParams } from "./signup/routes/signup-form/hooks/use-signup-search-params";
import { handleSignupSuccess } from "./signup/routes/signup-form/hooks/use-submit-signup-form";
import { getUserTypeFromParams } from "./signup/routes/signup-form/utils";
import { LoginSuccessResponse, SignupSuccessResponse } from "./types";

export type AuthType = "login" | "signup";

type GoogleSignupSucessResponse<
	TUserType extends AllowedSignupUserType = AllowedSignupUserType,
> =
	| (SignupSuccessResponse<TUserType> & { isLogin?: false })
	| (LoginSuccessResponse<TUserType> & { isLogin: true }); // A signup can turnout to be a login if the user tries to sign up with a Google account that is already authenticated.

type SuccessResponse<
	T extends AuthType,
	TUserType extends UserType = UserType,
> = T extends "signup"
	? TUserType extends AllowedSignupUserType
		? GoogleSignupSucessResponse<TUserType>
		: never
	: LoginSuccessResponse<TUserType>;

interface UseGoogleAuthProps<T extends AuthType> {
	authType: T;
}

interface HandleSubmitGoogleAuthProps<T extends AuthType> {
	authType: T;
	credential: CredentialResponse["credential"];
	userType?: UserType;
	refCode?: AuthSignupForm["refCode"];
}

const handleSubmitGoogleAuth = async <T extends AuthType>({
	authType,
	credential,
	userType,
	refCode,
}: HandleSubmitGoogleAuthProps<T>) => {
	const response = await apiAxiosInstance.post<SuccessResponse<T>>(
		`/auth/google-${authType}`,
		{
			authToken: credential,
			userType,
			refCode,
		},
		{
			skipUserTypePrefix: true,
			skipAuthHeader: true,
		},
	);

	return response.data;
};

export const useGoogleAuth = <T extends AuthType>({
	authType,
}: UseGoogleAuthProps<T>) => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const params = useParams();
	const userType = getUserTypeFromParams(params);
	if (authType === "signup" && !userType) {
		throw new Error("invalid 'userType': " + userType);
	}
	const [{ refCode }] = useSignupSearchParams();

	const { mutate, isPending } = useMutation({
		mutationFn: ({
			credential,
		}: Pick<HandleSubmitGoogleAuthProps<T>, "credential">) =>
			handleSubmitGoogleAuth({
				authType,
				credential,
				userType: userType ?? undefined,
				refCode: refCode ?? undefined,
			}),
		onMutate: () => ({
			authTypeOnMutate: authType, // save the value of authType when the mutation starts so we avoid the issue of authType changing before mutation completion.
		}),
		onSuccess: (response, _, context) => {
			if (!context) {
				toast.error("Unexpected context state");
				return;
			}
			const { authTypeOnMutate } = context;
			if (authTypeOnMutate === "signup") {
				const signupResponse = response as GoogleSignupSucessResponse;

				if (signupResponse.isLogin) {
					handleAuthLoginSuccess({
						response: signupResponse,
						queryClient,
						navigate,
					});
				} else {
					handleSignupSuccess({
						response: signupResponse,
						queryClient,
						navigate,
						isGoogleSignup: true,
					});
				}
				return;
			}

			handleAuthLoginSuccess({
				response: response as LoginSuccessResponse,
				queryClient,
				navigate,
			});
		},
		onError: (error, _, context) => {
			const message = context?.authTypeOnMutate
				? `Google ${context.authTypeOnMutate} failed.`
				: "Google auth failed.";
			toast.error(message, {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});

	return { mutate, isPending };
};
