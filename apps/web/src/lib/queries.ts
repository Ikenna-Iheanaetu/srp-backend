/** @format */

import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import apiAxiosInstance from "./axios-instance";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";

type ClubsListQueryParams = ServerPaginationParams & {
	search?: string;
};

const fetchClubs = async (params: ClubsListQueryParams) => {
	const response = await apiAxiosInstance.get<
		PaginatedServerResponse<ClubProfileData>
	>("/clubs", {
		params,
		skipUserTypePrefix: true,
		skipAuthHeader: true,
	});

	return response.data;
};

export const globalQueries = {
	all: () => ["global-queries"] as const,

	allClubs: ({
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: SafeOmit<ClubsListQueryParams, "page">) => {
		const params: ClubsListQueryParams = { limit, ...others };

		return infiniteQueryOptions({
			queryKey: [...globalQueries.all(), "all-clubs", params] as const,
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
