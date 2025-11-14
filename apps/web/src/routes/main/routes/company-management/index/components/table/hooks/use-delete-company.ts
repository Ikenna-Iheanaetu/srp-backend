/** @format */

import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { calculateNewMeta } from "@/lib/helper-functions/pagination";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { Company } from "../types";
import { useCompaniesTableQuery } from "./use-companies-table-query";

export const useDeleteCompany = () => {
	const { queryOptions } = useCompaniesTableQuery();

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (company: Company) => {
			await apiAxiosInstance.delete("/admin/company/" + company.id);
		},
		updater: (old, company) => {
			if (!old) return old;

			const filtered = old.data.filter(
				(prevCompany) => prevCompany.id !== company.id,
			);

			const newCompaniesTotal =
				old.meta.total - (old.data.length - filtered.length);

			const newMeta = calculateNewMeta({
				newDataTotal: newCompaniesTotal,
				prevMeta: old.meta,
			});

			return {
				...old,
				data: filtered,
				meta: newMeta,
			};
		},
		onSuccess: (_, company) => {
			toast.success(`Successfully deleted company, ${company.name}`);
		},
		onError: (error, company) => {
			toast.error(`Failed to delete company, ${company.name}`, {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
