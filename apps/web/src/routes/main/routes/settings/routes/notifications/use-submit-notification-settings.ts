/** @format */

import { useMutation } from "@tanstack/react-query";
import { NotificationSettingsForm } from "./form-schema";
import apiAxiosInstance from "@/lib/axios-instance";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";

export const useSubmitNotificationsSettings = () => {
	return useMutation({
		mutationFn: async (formData: NotificationSettingsForm) => {
			await apiAxiosInstance.put("/notifications", formData);
		},
		onSuccess: () => {
			toast.success("Notification settings updated successfully");
		},
		onError: (error) => {
			toast.error(getApiErrorMessage(error));
		},
	});
};
