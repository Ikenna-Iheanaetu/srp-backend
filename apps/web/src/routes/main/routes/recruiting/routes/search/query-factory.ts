/** @format */

import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { recruitmentQueries } from "../../query-factory";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ClubProfileData } from "../../../profile/club/use-fetch-profile";
import { SearchCandidateFilters } from "./components/filters-block";
import { PlayerDynamicCardData } from "@/components/user-dynamic-cards/player-card";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

type CandidatesQueryParams = ServerPaginationParams &
	Partial<SearchCandidateFilters>;

export interface ServerCandidateResponse extends PlayerDynamicCardData {
	shortlistedJobs: string[];
	isSupporter: boolean;
	userId: string;
	chatId?: string | null;
}

const fetchCandidates = async (params: CandidatesQueryParams) => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{
			hasData: true;
			data: PaginatedServerResponse<ServerCandidateResponse>;
		}>
	>("/players", {
		params,
	});

	return response.data.data;
};

type ClubsListQueryParams = ServerPaginationParams & {
	search?: string;
};
type PaginatedClubs = PaginatedServerResponse<ClubProfileData>;

const fetchClubs = async (
	params: ClubsListQueryParams,
): Promise<PaginatedClubs> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: PaginatedClubs }>
	>("/clubs", {
		params,
		skipUserTypePrefix: true,
	});

	return response.data.data;
};

export const searchQueries = {
	all: () => [...recruitmentQueries.all(), "candidates-search"],

	candidatesSearch: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...filters
	}: CandidatesQueryParams) => {
		const params = { page, limit, ...filters };
		return queryOptions({
			queryKey: [
				...searchQueries.all(),
				"candidates-search",
				params,
			] as const,
			queryFn: () => fetchCandidates(params),
		});
	},

	clubsList: ({
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: SafeOmit<ClubsListQueryParams, "page">) => {
		const params = { limit, ...others };

		return infiniteQueryOptions({
			queryKey: [...searchQueries.all(), "clubs-list", params] as const,
			queryFn: ({ pageParam }) =>
				fetchClubs({ ...params, page: pageParam }),
			initialPageParam: DEFAULT_PAGE_NUMBER,
			getNextPageParam: (lastPage) => {
				const nextPageNumber = lastPage.meta.page + 1;
				return nextPageNumber > lastPage.meta.totalPages
					? null
					: nextPageNumber;
			},
		});
	},
};
