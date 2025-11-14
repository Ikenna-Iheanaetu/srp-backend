/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { UserType } from "@/lib/schemas/user";
import { AUTH_MUTATION_URL } from "@/routes/auth/constants";
import { serializeVerifyEmailParams } from "@/routes/auth/routes/verify-email/schemas";
import {
	ApiProfileResponse,
	profileQueries,
} from "@/routes/main/routes/profile/query-factory";
import {
	AllowedProfileUserType,
	AllowedProfileUserTypeSchema,
} from "@/routes/main/routes/profile/schemas";
import {
	QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { href, NavigateFunction, useNavigate } from "react-router";
import { setAuthCookies } from "../../../cookie-management/utils";
import { LoginSuccessResponse } from "../../../types";
import { AuthLoginForm } from "./form-schema";

interface HandleLoginSuccessProps<T extends UserType> {
	response: LoginSuccessResponse<T>;
	queryClient: QueryClient;
	navigate: NavigateFunction;
}

export const handleAuthLoginSuccess = <T extends UserType>({
	response,
	queryClient,
	navigate,
}: HandleLoginSuccessProps<T>) => {
	const user = response.data.user;
	const userTypeWithProfile = AllowedProfileUserTypeSchema.safeParse(
		user.userType,
	).data;
	if (userTypeWithProfile) {
		queryClient.setQueryData(
			profileQueries.byUserType(userTypeWithProfile).queryKey,
			user as ApiProfileResponse[AllowedProfileUserType],
		);
	}

	setAuthCookies({
		accessToken: response.data.accessToken,
		refreshToken: response.data.refreshToken,
		userType: user.userType,
	});

	if (user.userType !== "admin" && user.status === "pending") {
		void navigate({
			pathname: href("/verify-email"),
			search: serializeVerifyEmailParams({ email: user.email }),
		});
		return;
	}

	void navigate(href("/dashboard"));
};

const useSubmitLoginForm = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (formData: AuthLoginForm) => {
			const response = await apiAxiosInstance.post<
				LoginSuccessResponse<UserType>
			>(AUTH_MUTATION_URL + "/login", formData, {
				skipUserTypePrefix: true,
				skipAuthHeader: true,
				skipAuthRefresh: true,
			});

			return response.data;
		},

		onSuccess: (response) => {
			handleAuthLoginSuccess({
				response,
				queryClient,
				navigate,
			});
		},
		meta: {
			errorMessage: "Login failed",
		},
	});

	return mutation;
};

export default useSubmitLoginForm;
