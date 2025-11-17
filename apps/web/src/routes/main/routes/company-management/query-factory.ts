/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { queryOptions } from "@tanstack/react-query";
import { CompanyHire } from "./hires/hires-table/columns";
import { Company } from "./index/components/table/types";
import { TableQueryParams } from "@/types/tanstack-table";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

export const COMPANY_MANAGEMENT_REQUEST_PATH = "/admin/companies";

type PaginatedCompanies = PaginatedServerResponse<Company>;

const fetchCompanies = async (
  params: ServerPaginationParams,
): Promise<PaginatedCompanies> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: PaginatedCompanies }>
  >("/admin/companies", {
		params,
	});
	return response.data.data;
};

type CompanyHiresApiResponseData = PaginatedServerResponse<CompanyHire> & {
	title: string;
};
type CompanyHiresApiResponse = ApiSuccessResponse<{
	data: CompanyHiresApiResponseData;
}>;

interface CompanyHiresRequestParams extends ServerPaginationParams {
	companyId: string;
}

const fetchCompanyHires = async (
	params: CompanyHiresRequestParams,
): Promise<CompanyHiresApiResponseData> => {
	const { companyId, ...otherParams } = params;
	const response = await apiAxiosInstance.get<CompanyHiresApiResponse>(
		`/admin/company/hired/${companyId}`,
		{
			params: otherParams,
		},
	);
	return response.data.data;
};

export const companyManagementQueries = {
	all: () => ["admin-company-management"] as const,

	companies: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: TableQueryParams = {}) => {
		const params: TableQueryParams = {
			page,
			limit,
			...others,
		};

		return queryOptions({
			queryKey: [
				companyManagementQueries.all(),
				"companies",
				params,
			] as const,
			queryFn: () => fetchCompanies(params),
		});
	},

	companyHires: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		companyId,
	}: CompanyHiresRequestParams) => {
		const params = {
			page,
			limit,
			companyId,
		};

		return queryOptions({
			queryKey: [
				companyManagementQueries.all(),
				"companyHires",
				params,
			] as const,
			queryFn: () => fetchCompanyHires(params),
		});
	},
};
