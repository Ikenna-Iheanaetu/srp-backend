/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import apiAxiosInstance from "@/lib/axios-instance";
import { PaginatedServerResponse } from "@/types/pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { queryOptions } from "@tanstack/react-query";
import { DraftedJob, DraftedJobsColumnFilters } from "./columns";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

type DraftedJobsQueryParams = TableQueryParams<DraftedJobsColumnFilters>;

const fetchDraftedJobs = async (params: DraftedJobsQueryParams) => {
	// Always include status=drafted for drafted jobs, but allow other filters
	const queryParams = {
		...params,
		status: 'drafted', // Ensure we always filter for drafted jobs
	};

	const response = await apiAxiosInstance.get<
	ApiSuccessResponse<{ hasData: true; data: PaginatedServerResponse<DraftedJob> }>
	>(
		"/jobs",
		{
			params: queryParams,
		}
	);

	return response.data.data;
};

export const draftedJobsQueries = {
	all: () => ["company-drafted-jobs"] as const,

	jobs: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: DraftedJobsQueryParams = {}) => {
		const params: DraftedJobsQueryParams = { page, limit, ...others };
		return queryOptions({
			queryKey: [...draftedJobsQueries.all(), "search", params] as const,
			queryFn: () => fetchDraftedJobs(params),
			meta: {
				onError: () => "Couldn't fetch jobs in draft",
			},
		});
	},
};
