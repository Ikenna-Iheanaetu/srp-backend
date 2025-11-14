/** @format */

import apiAxiosInstance from "@/lib/axios-instance";
import {
	AUTH_MUTATION_URL,
	AUTH_REQUEST_DEFAULTS,
} from "@/routes/auth/constants";
import { useMutation } from "@tanstack/react-query";
import { OTPForm } from "./form-schema";

const handleSubmitForm = (values: OTPForm) =>
	apiAxiosInstance.post<void>(
		AUTH_MUTATION_URL + "/verify-otp",
		values,
		AUTH_REQUEST_DEFAULTS
	);

export const useVerifyOTP = () => {
	return useMutation({
		mutationFn: handleSubmitForm,
		meta: {
			errorMessage: "OTP validation failed",
		},
	});
};
