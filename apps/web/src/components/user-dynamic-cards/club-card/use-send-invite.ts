/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { InvitationForm } from "./invite-form-schema";

export const useSendInvite = () => {
	return useMutation({
		mutationFn: async (data: InvitationForm) => {
			await apiAxiosInstance.post("/club/affiliates", data);
		},
		onSuccess: (_, { emails, type }) => {
			toast.success(
				`Successfully invited ${
					emails.length > 1
						? `${emails.length} ${type}(s)`
						: `a ${type}`
				}.`
			);
		},
		onError: (error, { type }) => {
			toast.error(`Failed to invite ${type}(s) to join your club.`, {
				description: getApiErrorMessage(error),
			});
		},
	});
};
