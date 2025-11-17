/** @format */

import { LinkButton } from "@/components/common/link-btn";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useMutation } from "@tanstack/react-query";
import { href } from "react-router";
import { toast } from "sonner";

export const useSubmitProfileSettings = () => {
	return useMutation({
		mutationFn: async (formData: FormData) => {
			await apiAxiosInstance.patch("/profile", formData);
		},
		onSuccess: () => {
			toast.success("Profile updated successfully", {
				action: (
					<LinkButton to={href("/profile")} className="button">
						View Profile
					</LinkButton>
				),
			});
		},
		onError: (error) => {
			toast.error("Profile update failed", {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
