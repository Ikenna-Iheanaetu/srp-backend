/** @format */

import { CompanyDynamicCardData } from "@/components/user-dynamic-cards/partner";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { queryOptions } from "@tanstack/react-query";
import { CompanyProfileData } from "../../../profile/company/use-fetch-profile";
import { jobsQueries } from "../../query-factory";
import { BaseJob } from "../../types";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

interface CompaniesQueryParams extends ServerPaginationParams {
	search?: string;
}

export type CompanyToView = CompanyDynamicCardData & {
	/**This is the id to use for initiating any chat. */
	userId: string;
	chatId?: string | null;
};

type PaginatedCompanies = PaginatedServerResponse<CompanyToView>;
type CompaniesApiResponse = ApiSuccessResponse<{ data: PaginatedCompanies }>;
const fetchCompanies = async (
	params: CompaniesQueryParams,
): Promise<PaginatedCompanies> => {
	const response = await apiAxiosInstance.get<CompaniesApiResponse>(
		"/companies",
		{ params },
	);
	return response.data.data;
};

interface JobsByCompanyQueryParams extends ServerPaginationParams {
	companyId: string;
	search?: string;
}
export type JobByCompany = SafeOmit<BaseJob, "company">;

type JobsByCompanyApiResponseData = PaginatedServerResponse<JobByCompany> & {
	company: Pick<CompanyProfileData, "id" | "name" | "avatar">;
};
type JobsByCompanyApiResponse = ApiSuccessResponse<{
	data: JobsByCompanyApiResponseData;
}>;

const fetchJobsByCompany = async ({
	companyId,
	...params
}: JobsByCompanyQueryParams): Promise<JobsByCompanyApiResponseData> => {
	const response = await apiAxiosInstance.get<JobsByCompanyApiResponse>(
		`/company/${companyId}/jobs`,
		{ params },
	);

	return response.data.data;
};

export const companiesSearchQueries = {
	all: () => [...jobsQueries.all(), "companies-search"] as const,

	companies: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: CompaniesQueryParams) => {
		const params: CompaniesQueryParams = { page, limit, ...others };
		return queryOptions({
			queryKey: [
				...companiesSearchQueries.all(),
				"companies",
				params,
			] as const,
			queryFn: () => fetchCompanies(params),
			meta: {
				onError: () => "Error fetching companies",
			},
		});
	},

	jobsByCompany: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: JobsByCompanyQueryParams) => {
		const params: JobsByCompanyQueryParams = { page, limit, ...others };
		return queryOptions({
			queryKey: [
				...companiesSearchQueries.all(),
				"jobs-by-company",
				params,
			] as const,
			queryFn: () => fetchJobsByCompany(params),
		});
	},
};
