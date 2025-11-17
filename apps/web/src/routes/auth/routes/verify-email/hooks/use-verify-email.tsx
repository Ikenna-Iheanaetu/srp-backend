/** @format */

import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { getErrorMessage } from "@/lib/utils";
import { profileQueries } from "@/routes/main/routes/profile/query-factory";
import { AllowedProfileUserTypeSchema } from "@/routes/main/routes/profile/schemas";
import { useMutation } from "@tanstack/react-query";
import { href, useNavigate } from "react-router";
import { toast } from "sonner";

interface VerifyEmailRequestBody {
	email: string;
	otp: string;
}

export const useVerifyEmail = () => {
	const navigate = useNavigate();
	const { isAuthenticated, cookies } = useAuthStatus({
		assertAuthenticated: false,
	});

	return useMutation({
		mutationFn: async (body: VerifyEmailRequestBody) => {
			await apiAxiosInstance.post("/auth/verify-account", body, {
				skipAuthHeader: true,
				skipUserTypePrefix: true,
				skipAuthRefresh: true,
			});
		},
		onSuccess: async (_data, _variables, _onMutateResult, { client }) => {
			toast.success("Email verified successfully.");

			if (isAuthenticated) {
				const userWithProfile = AllowedProfileUserTypeSchema.safeParse(
					cookies.userType,
				).data;
				if (userWithProfile) {
					const { queryKey } =
						profileQueries.byUserType(userWithProfile);
					client.setQueryData(queryKey, (old) => {
						const canTransitionToActive =
							old && old.status === "pending";
						if (!canTransitionToActive) return old;

						return {
							...old,
							status: "active" as const, // email is now active
						};
					});
				}
			}

			await navigate(href("/onboarding"), {
				replace: true,
			});
		},
		onError: (error) => {
			toast.error("Error occured while verifying your email.", {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
