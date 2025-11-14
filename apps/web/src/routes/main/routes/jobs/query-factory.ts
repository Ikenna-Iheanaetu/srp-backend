/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { queryOptions } from "@tanstack/react-query";
import { TrackingJob } from "./routes/tracking/player/table/columns";
import { TrackingJobTableFilters } from "./routes/tracking/player/table/table-filters";
import { BaseJob } from "./types";

export interface JobSearchFilters {
	clubTypes: string[];
	clubs: string[];
	regions: string[];
	industry: string[];
	workTypes: string[];
}

export type SearchQueryPaginatedParams = ServerPaginationParams &
	Partial<JobSearchFilters> & {
		search?: string | undefined;
	};

/**@deprecated Explicitly provide this api endpoint. Don't use constants */
export const JOBS_REQUEST_PATH = "/jobs";

type PaginatedJobs = PaginatedServerResponse<BaseJob>;
type JobsApiResponse = ApiSuccessResponse<{ data: PaginatedJobs }>;
const fetchJobs = async (
	params: SearchQueryPaginatedParams,
): Promise<PaginatedJobs> => {
	const response = await apiAxiosInstance.get<JobsApiResponse>("/jobs", {
		params,
	});

	return response.data.data;
};

type TrackingJobsParams = TableQueryParams<TrackingJobTableFilters>;

type PaginatedTrackedJobs = PaginatedServerResponse<TrackingJob>;
type TrackedJobsApiResponse = ApiSuccessResponse<{
	data: PaginatedTrackedJobs;
}>;
const fetchTrackingJobs = async (
	params: TrackingJobsParams,
): Promise<PaginatedTrackedJobs> => {
	const response = await apiAxiosInstance.get<TrackedJobsApiResponse>(
		"/jobs/tracking",
		{
			params,
		},
	);

	return response.data.data;
};

const fetchJobDetails = async (jobId: string): Promise<BaseJob> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: BaseJob }>
	>(`/jobs/${jobId}`);
	return response.data.data;
};

export const jobsQueries = {
	// Base key for all job-related queries
	all: () => ["candidate-jobs"] as const,

	// Plural base key for searches
	searches: () => [...jobsQueries.all(), "search"] as const,

	// Singular query for searching jobs with pagination
	search: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		search,
		...filters
	}: SearchQueryPaginatedParams = {}) => {
		const params = { page, limit, search, ...filters };
		return queryOptions({
			queryKey: [...jobsQueries.searches(), params] as const,
			queryFn: () => fetchJobs(params),
		});
	},

	tracking: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: TrackingJobsParams = {}) => {
		const params: TrackingJobsParams = { page, limit, ...others };
		return queryOptions({
			queryKey: [...jobsQueries.all(), "tracking", params] as const,
			queryFn: () => fetchTrackingJobs(params),
		});
	},

	// Plural base key for job details
	details: () => [...jobsQueries.all(), "detail"],

	// Singular query for a specific job by ID
	detail: (jobId: string) =>
		queryOptions({
			queryKey: [...jobsQueries.details(), jobId] as const,
			queryFn: () => fetchJobDetails(jobId),
		}),
};

/**@deprecated Usage of this type is wrong. This will type will be removed in future. */
export type JobDetailsQueryKey = ReturnType<
	typeof jobsQueries.detail
>["queryKey"];
