/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import apiAxiosInstance from "@/lib/axios-instance";
import { PaginatedServerResponse } from "@/types/pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { queryOptions } from "@tanstack/react-query";
import { PostedJob, PostedJobsColumnFilters } from "./columns";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

type PostedJobsQueryParams = TableQueryParams<PostedJobsColumnFilters>;

const fetchPostedJobs = async (params: PostedJobsQueryParams) => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ hasData: true; data: PaginatedServerResponse<PostedJob> }>
	>("/jobs", {
		params,
	});

	return response.data.data;
};

export const postedJobsQueries = {
	all: () => ["company-posted-jobs"] as const,

	jobs: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: PostedJobsQueryParams = {}) => {
		const params: PostedJobsQueryParams = { page, limit, ...others };
		return queryOptions({
			queryKey: [...postedJobsQueries.all(), "search", params] as const,
			queryFn: () => fetchPostedJobs(params),
			meta: {
				onError: () => "Couldn't fetch posted jobs",
			},
		});
	},
};
