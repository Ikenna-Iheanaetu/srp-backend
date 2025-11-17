/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { useMutation } from "@tanstack/react-query";
import { href, useNavigate } from "react-router";
import { toast } from "sonner";
import { InquirySearchParams } from "./schemas";

export const useConfirmInquiry = () => {
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (
			body: SafeOmit<InquirySearchParams, "companyName">,
		) => {
			await apiAxiosInstance.post("/chats/hire-confirmation", body, {
				skipAuthHeader: true,
				skipUserTypePrefix: true,
				skipAuthRefresh: true,
			});
		},
		onSuccess: async () => {
			toast.success("Inquiry confirmed");
			await navigate(href("/messages"));
		},
		meta: {
			errorMessage: "Couldn't confirm inquiry",
		},
	});
};
