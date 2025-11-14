/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { useMutation } from "@tanstack/react-query";

export const useSendOTPMutaion = () => {
	return useMutation({
		mutationFn: async (body: { email: string }) => {
			await apiAxiosInstance.post("/auth/resend-otp", body, {
				skipAuthHeader: true,
				skipUserTypePrefix: true,
				skipAuthRefresh: true,
			});
		},
		meta: {
			errorMessage: "Failed to resend OTP",
		},
	});
};
