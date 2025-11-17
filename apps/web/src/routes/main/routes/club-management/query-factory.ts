/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ClubHire } from "./hires/hires-table/columns";
import { Club } from "./index/components/clubs-table/columns";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

export const ADMIN_CLUBS_API_ENDPOINT = "/admin/clubs";

export interface AdminClubsQueryParams extends ServerPaginationParams {
	search?: string;
}

type PaginatedClubs = PaginatedServerResponse<Club>;
export type AdminClubsApiResponse = ApiSuccessResponse<{
	data: PaginatedClubs;
}>;

const fetchClubs = async (
	params: AdminClubsQueryParams,
): Promise<PaginatedClubs> => {
	const response = await apiAxiosInstance.get<AdminClubsApiResponse>(
		ADMIN_CLUBS_API_ENDPOINT,
		{
			params,
		},
	);
	return response.data.data;
};

type ClubHiresApiResponseData = PaginatedServerResponse<ClubHire> & {
	title: string;
};
type ClubHiresApiResponse = ApiSuccessResponse<{
	data: ClubHiresApiResponseData;
}>;

interface ClubHiresRequestParams extends ServerPaginationParams {
	clubId: string;
}

const fetchClubHires = async (
	params: ClubHiresRequestParams,
): Promise<ClubHiresApiResponseData> => {
	const { clubId, ...otherParams } = params;
	const response = await apiAxiosInstance.get<ClubHiresApiResponse>(
		`/admin/club/hired/${clubId}`,
		{
			params: otherParams,
		},
	);
	return response.data.data;
};

export const clubManagementQueries = {
	all: () => ["admin-club-management"] as const,

	clubsAll: () => [...clubManagementQueries.all(), "clubs"] as const,

	clubs: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: AdminClubsQueryParams = {}) => {
		const params: AdminClubsQueryParams = {
			page,
			limit,
			...others,
		};

		return queryOptions({
			queryKey: [...clubManagementQueries.clubsAll(), params] as const,
			queryFn: () => fetchClubs(params),
		});
	},

	infiniteClubs: ({
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: SafeOmit<AdminClubsQueryParams, "page"> = {}) => {
		const params = { limit, ...others };

		return infiniteQueryOptions({
			queryKey: [
				...clubManagementQueries.clubsAll(),
				"infinite",
				params,
			] as const,
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

	clubHires: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		clubId,
	}: ClubHiresRequestParams) => {
		const params: ClubHiresRequestParams = {
			page,
			limit,
			clubId,
		};

		return queryOptions({
			queryKey: [
				...clubManagementQueries.all(),
				"club-hires",
				params,
			] as const,
			queryFn: () => fetchClubHires(params),
		});
	},
};
