/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PasswordChangeForm } from "../../utils/password-schema";

export const useSubmitPasswordChangeForm = () => {
	return useMutation({
		mutationFn: async (
			formData: Pick<
				PasswordChangeForm,
				"oldPassword" | "newPassword" | "securityQuestion"
			>,
		) => {
			await apiAxiosInstance.post("/auth/change-password", formData, {
				skipUserTypePrefix: true,
			});
		},
		onSuccess: () => {
			toast.success("Password changed successfully");
		},
		meta: {
			errorMessage: "Couldn't change password",
		},
	});
};
