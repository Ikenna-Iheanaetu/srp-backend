/** @format */

import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { usePagination } from "@/hooks/use-pagination";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useParams } from "react-router";
import { toast } from "sonner";
import { companyManagementQueries } from "../../query-factory";
import { CompanyHire } from "./columns";

export const useDeleteCompanyHire = () => {
	const { id: companyId } = useParams();
	const { pageIndex, pageSize } = usePagination();
	const queryKey = companyManagementQueries.companyHires({
		page: pageIndex + 1,
		limit: pageSize,
		companyId: companyId!,
	}).queryKey;
	const toastId = "admin-company-hire-delete";

	return useOptimisticMutation({
		queryKey,
		mutationFn: async (hire: CompanyHire) => {
			await apiAxiosInstance.delete(`/admin/hire/${hire.id}`);
		},
		updater: (old, hire) => {
			if (!old) return old;

			return {
				...old,
				data: old.data.filter((prevHire) => prevHire.id !== hire.id),
			};
		},
		onError: (error, hire) => {
			toast.error(`Failed to delete ${hire.name}`, {
				id: toastId + "error" + hire.id,
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
