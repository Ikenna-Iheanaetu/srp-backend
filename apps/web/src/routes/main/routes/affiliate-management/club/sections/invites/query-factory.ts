/** @format */

import { TableQueryParams } from "@/types/tanstack-table";
import { InvitedAffiliate, InvitedAffiliateFilters } from "./columns";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { PaginatedServerResponse } from "@/types/pagination";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { queryOptions } from "@tanstack/react-query";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

type InvitedAffiliatesQueryParams = TableQueryParams<InvitedAffiliateFilters>;
type PaginatedInvitedAffilaites = PaginatedServerResponse<InvitedAffiliate>;
const fetchAffiliates = async (
	params: InvitedAffiliatesQueryParams,
): Promise<PaginatedInvitedAffilaites> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: PaginatedInvitedAffilaites }>
	>("/club/affiliates", {
		params,
	});

	return response.data.data;
};

export const invitedAffiliatesQueries = {
	all: () => ["club-invited-affiliates"] as const,

	affiliates: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: InvitedAffiliatesQueryParams) => {
		const params: InvitedAffiliatesQueryParams = { page, limit, ...others };

		return queryOptions({
			queryKey: [
				...invitedAffiliatesQueries.all(),
				params,
				"affiliates",
			] as const,
			queryFn: () => fetchAffiliates(params),
			meta: {
				onError: () => "Error fetching invited affiliates",
			},
		});
	},
};
