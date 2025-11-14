/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { AUTH_MUTATION_URL } from "@/routes/auth/constants";
import { serializeVerifyEmailParams } from "@/routes/auth/routes/verify-email/schemas";
import { profileQueries } from "@/routes/main/routes/profile/query-factory";
import { AllowedProfileUserTypeSchema } from "@/routes/main/routes/profile/schemas";
import { UserProfile } from "@/routes/main/routes/profile/types";
import {
	QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { href, NavigateFunction, useNavigate } from "react-router";
import { setAuthCookies } from "../../../../cookie-management/utils";
import { SignupSuccessResponse } from "../../../../types";
import { AllowedSignupUserTypeSchema, AuthSignupForm } from "../form-schema";

interface HandleSignupSuccessProps {
	response: SignupSuccessResponse;
	queryClient: QueryClient;
	navigate: NavigateFunction;
	isGoogleSignup?: boolean;
}

const apiPendingUpdateUserTypeProp = (
	user: unknown,
): user is SafeOmit<UserProfile, "userType"> & {
	type: UserProfile["userType"];
} =>
	!!user &&
	typeof user === "object" &&
	"type" in user &&
	AllowedSignupUserTypeSchema.safeParse(user.type).success;

export const handleSignupSuccess = ({
	response,
	queryClient,
	navigate,
	isGoogleSignup,
}: HandleSignupSuccessProps) => {
	let user = response.data.user;
	// check if api has updated type prop to userType
	if (apiPendingUpdateUserTypeProp(user)) {
		const { type, ...userWithoutType } = user;
		user = { ...userWithoutType, userType: type } as UserProfile;
	}

	if (!AllowedProfileUserTypeSchema.safeParse(user.userType).success) {
		throw new Error(
			"[handleSignupSuccess]: returned user type is invalid",
			{
				cause: user,
			},
		);
	}

	queryClient.setQueryData(
		profileQueries.byUserType(user.userType).queryKey,
		user,
	);

	setAuthCookies({
		accessToken: response.data.accessToken,
		refreshToken: response.data.refreshToken,
		userType: user.userType,
	});

	if (isGoogleSignup) {
		void navigate(href("/onboarding"));
	} else {
		void navigate({
			pathname: href("/verify-email"),
			search: serializeVerifyEmailParams({
				email: user.email,
			}),
		});
	}
};

export const useSubmitSignupForm = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (formData: AuthSignupForm) => {
			const { confirmPassword: _, ...data } = formData;
			const response = await apiAxiosInstance.post<SignupSuccessResponse>(
				AUTH_MUTATION_URL + "/signup",
				data,
				{
					skipUserTypePrefix: true,
					skipAuthHeader: true,
					skipAuthRefresh: true,
				},
			);
			return response.data;
		},
		onSuccess: (response) => {
			handleSignupSuccess({ response, queryClient, navigate });
		},
		meta: {
			errorMessage: "Sign up failed",
		},
	});

	return mutation;
};

export default useSubmitSignupForm;
