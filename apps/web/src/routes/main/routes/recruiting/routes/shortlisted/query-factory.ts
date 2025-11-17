/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import apiAxiosInstance from "@/lib/axios-instance";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { queryOptions } from "@tanstack/react-query";
import { recruitmentQueries } from "../../query-factory";
import { ShortlistedJob } from "./routes/index/columns";
import { ShortlistedCandidate } from "./routes/candidates/columns";
import { ShortlistedJobFilters } from "./routes/index/table-filters";
import { TableQueryParams } from "@/types/tanstack-table";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

export const SHORTLISTED_JOBS_REQUEST_PATH = "/shortlisted";

type ShortlistedJobQueryParams = TableQueryParams<ShortlistedJobFilters>;

const fetchJobs = async (params: ServerPaginationParams): Promise<PaginatedServerResponse<ShortlistedJob>> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ hasData: true; data: PaginatedServerResponse<ShortlistedJob> }>
	>("/shortlisted", {
		params,
	});

	// Backend now returns the correct { data: [], meta: { totalPages: ... } } format
	return response.data.data;
};

type ShortlistedCandidatesParams = TableQueryParams & {
	jobId: string;
};

const fetchCandidates = async (externalParams: ShortlistedCandidatesParams): Promise<PaginatedServerResponse<ShortlistedCandidate>> => {
	const { jobId, ...params } = externalParams;
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ hasData: true; data: PaginatedServerResponse<ShortlistedCandidate> }>
	>("/shortlisted/" + jobId, {
		params,
	});

	// Backend now returns the correct { data: [], meta: { totalPages: ... } } format
	return response.data.data;
};

export const shortlistedJobsQueries = {
	all: () => [...recruitmentQueries.all(), "shortlisted"] as const,

	jobs: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: ShortlistedJobQueryParams) => {
		const params: ShortlistedJobQueryParams = { page, limit, ...others };

		return queryOptions({
			queryKey: [
				...shortlistedJobsQueries.all(),
				params,
				"jobs",
			] as const,
			queryFn: () => fetchJobs(params),
		});
	},

	candidates: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: ShortlistedCandidatesParams) => {
		const params = { page, limit, ...others };
		return queryOptions({
			queryKey: [
				...shortlistedJobsQueries.all(),
				params,
				"candidates",
			] as const,
			queryFn: () => fetchCandidates(params),
		});
	},
};
