/** @format */

import apiAxiosInstance from "@/lib/axios-instance";
import {
	AUTH_MUTATION_URL,
	AUTH_REQUEST_DEFAULTS,
} from "@/routes/auth/constants";
import { useMutation } from "@tanstack/react-query";
import { OTPForm } from "./form-schema";

const handleSendOTP = (values: Pick<OTPForm, "email">) =>
	apiAxiosInstance.post<void>(
		AUTH_MUTATION_URL + "/forgot-password",
		values,
		AUTH_REQUEST_DEFAULTS
	);

export const useSendOTP = () => {
	return useMutation({
		mutationFn: handleSendOTP,
		meta: {
			errorMessage: "Failed to send OTP",
		},
	});
};
