/** @format */

import { CompanyDynamicCardData } from "@/components/user-dynamic-cards/partner";
import { PlayerDynamicCardData } from "@/components/user-dynamic-cards/player-card";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { ClubReferredUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { queryOptions } from "@tanstack/react-query";

export interface AffiliateFilters {
	affiliateTypes: ClubReferredUserType[];
	search: string;
}

export interface AffiliatesApiResponseData {
	id: string;
	isSaved: boolean;
	userData: (PlayerDynamicCardData | CompanyDynamicCardData) & {
		userId: string;
	};
}

type AffiliatesQueryParams = Partial<ServerPaginationParams & AffiliateFilters>;
type PaginatedAffiliates = PaginatedServerResponse<AffiliatesApiResponseData>;
const fetchAffiliates = async (
	params: AffiliatesQueryParams,
): Promise<PaginatedAffiliates> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: PaginatedAffiliates }>
	>("/club/affiliates", {
		params,
	});

	return response.data.data;
};

export const affliatesQueries = {
	all: () => ["club-affiliates"] as const,

	affiliates: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: AffiliatesQueryParams) => {
		const params: AffiliatesQueryParams = { page, limit, ...others };

		return queryOptions({
			queryKey: [
				...affliatesQueries.all(),
				"affiliates",
				params,
			] as const,
			queryFn: () => fetchAffiliates(params),
			meta: {
				onError: () => "Error fetching affiliates",
			},
		});
	},
};
