/** @format */

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResetPasswordForm } from "./form-schema";
import { OTPForm } from "../otp-form/form-schema";
import { Prettify } from "@/types";
import apiAxiosInstance from "@/lib/axios-instance";
import {
	AUTH_MUTATION_URL,
	AUTH_REQUEST_DEFAULTS,
} from "@/routes/auth/constants";

type SubmitValues = Prettify<Pick<ResetPasswordForm, "password"> & OTPForm>;

const handleSubmit = (values: SubmitValues) =>
	apiAxiosInstance.post(
		AUTH_MUTATION_URL + "/reset-password",
		values,
		AUTH_REQUEST_DEFAULTS
	);

export const useSubmitForm = () => {
	return useMutation({
		mutationFn: handleSubmit,
		onSuccess: () => {
			toast.success("Password reset successful", {
				description: "Login with your new password",
			});
		},
		meta: {
			errorMessage: "Password reset failed",
		},
	});
};
