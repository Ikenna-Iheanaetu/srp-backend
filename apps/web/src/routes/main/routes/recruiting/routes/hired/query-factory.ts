/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import apiAxiosInstance from "@/lib/axios-instance";
import { PaginatedServerResponse } from "@/types/pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { queryOptions } from "@tanstack/react-query";
import { recruitmentQueries } from "../../query-factory";
import { HiredCandidate } from "./routes/candidates/columns";
import { HiredJob } from "./routes/index/columns";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

export const HIRED_JOBS_REQUEST_PATH = "/hired";

type HiredJobsQueryParams = TableQueryParams; // Allow search; backend now supports it

const fetchJobs = async (params: HiredJobsQueryParams): Promise<PaginatedServerResponse<HiredJob>> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ hasData: true; data: PaginatedServerResponse<HiredJob> }>
	>("/hired", {
		params,
	});

	return response.data.data;
};

type HiredCandidatesParams = TableQueryParams<{
	jobId: string;
}>;

const fetchCandidates = async (externalParams: HiredCandidatesParams): Promise<PaginatedServerResponse<HiredCandidate>> => {
	const { jobId, ...params } = externalParams;
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ hasData: true; data: PaginatedServerResponse<HiredCandidate> }>
	>("/hired/" + jobId, {
		params,
	});

	// Backend now returns the correct { data: [], meta: { totalPages: ... } } format
	return response.data.data;
};

export const hiredJobsQueries = {
	all: () => [...recruitmentQueries.all(), "hired"] as const,

	jobs: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: HiredJobsQueryParams) => {
		const params = { page, limit, ...others };
		return queryOptions({
			queryKey: [...hiredJobsQueries.all(), "jobs", params] as const,
			queryFn: () => fetchJobs(params),
		});
	},

	candidates: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: HiredCandidatesParams) => {
		const params = { page, limit, ...others };
		return queryOptions({
			queryKey: [
				...hiredJobsQueries.jobs(params).queryKey,
				params,
				"candidates",
			] as const,
			queryFn: () => fetchCandidates(params),
		});
	},
};
