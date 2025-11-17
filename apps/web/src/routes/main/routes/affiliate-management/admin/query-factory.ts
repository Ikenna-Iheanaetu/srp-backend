/** @format */

import { PaginatedServerResponse } from "@/types/pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { queryOptions } from "@tanstack/react-query";
import { Affiliate } from "./columns";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

const AFFILIATES_REQUEST_PATH = "/affiliates";

export interface AffiliatesFilters {
	clubId: string;
}

type AffiliatesQueryParams = TableQueryParams<AffiliatesFilters>;

type PaginatedAffiliates = PaginatedServerResponse<Affiliate>;
type AffiliatesApiResponse = ApiSuccessResponse<{ data: PaginatedAffiliates }>;
const fetchAffiliates = async (
	params: AffiliatesQueryParams,
): Promise<PaginatedAffiliates> => {
	const response = await apiAxiosInstance.get<AffiliatesApiResponse>(
		"/admin/affiliates",
		{ params },
	);
	return response.data.data;
};

const affiliateManagementQueries = {
	all: () => ["admin-affiliate-management"] as const,
	affiliates: ({
		page = 1,
		limit = 10,
		...others
	}: AffiliatesQueryParams = {}) => {
		const params: AffiliatesQueryParams = { page, limit, ...others };
		return queryOptions({
			queryKey: [
				...affiliateManagementQueries.all(),
				"affiliates",
				params,
			] as const,
			queryFn: () => fetchAffiliates(params),
		});
	},
};

export { affiliateManagementQueries, AFFILIATES_REQUEST_PATH };
