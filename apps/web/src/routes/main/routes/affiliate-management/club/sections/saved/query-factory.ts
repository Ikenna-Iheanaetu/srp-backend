/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { ClubReferredUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { CompanyProfileData } from "@/routes/main/routes/profile/company/use-fetch-profile";
import { PlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { queryOptions } from "@tanstack/react-query";

export interface SavedAffiliateFilters {
	affiliateTypes: ClubReferredUserType[];
}

export type SavedAffiliatesApiResponseData = Prettify<
	SafeOmit<
		PlayerProfileData | CompanyProfileData,
		"club" // club field is gotten from the club profile data
	> & {
		userId: string;
	}
>;

type SavedAffiliatesQueryParams = Partial<
	ServerPaginationParams & SavedAffiliateFilters
>;
type PaginatedSavedAffiliates =
	PaginatedServerResponse<SavedAffiliatesApiResponseData>;
const fetchAffiliates = async (
	params: SavedAffiliatesQueryParams,
): Promise<PaginatedSavedAffiliates> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: PaginatedSavedAffiliates }>
	>("/club/save", {
		params,
	});

	return response.data.data;
};

export const savedAffliatesQueries = {
	all: () => ["club-saved-affiliates"] as const,

	affiliates: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: SavedAffiliatesQueryParams) => {
		const params: SavedAffiliatesQueryParams = { page, limit, ...others };

		return queryOptions({
			queryKey: [
				...savedAffliatesQueries.all(),
				"affiliates",
				params,
			] as const,
			queryFn: () => fetchAffiliates(params),
			meta: {
				onError: () => "Error fetching saved affiliates",
			},
		});
	},
};
