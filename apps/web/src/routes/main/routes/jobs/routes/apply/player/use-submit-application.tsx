/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { getErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { href, useParams } from "react-router";
import { toast } from "sonner";

export const useSubmitJobApplication = () => {
	const { id } = useParams();
	return useMutation({
		mutationFn: async (form: FormData) => {
			await apiAxiosInstance.post("/jobs/apply/" + id, form);
		},
		onSuccess: () => {
			toast.success("Application successful", {
				action: (
					<LinkButton to={href("/jobs/tracking")} className="button">
						Track job
					</LinkButton>
				),
			});
		},
		onError: (error) => {
			toast.error("Application failed", {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
