/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { PaginatedServerResponse } from "@/types/pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { queryOptions } from "@tanstack/react-query";
import { inviteManagementQueries } from "../../query-factory";
import { UnclaimedInviteUser, UnclaimedInvitesFilters } from "./columns";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

type UnclaimedInvitesQueryParams = TableQueryParams<UnclaimedInvitesFilters>;

type PaginatedUnclaimedInvite = PaginatedServerResponse<UnclaimedInviteUser>;
type UnclaimedInviteApiResponse = ApiSuccessResponse<{
	data: PaginatedUnclaimedInvite;
}>;
const fetchInvites = async (
	params: UnclaimedInvitesQueryParams,
): Promise<PaginatedUnclaimedInvite> => {
	const response = await apiAxiosInstance.get<UnclaimedInviteApiResponse>(
		"/admin/affiliates/invites/unclaimed",
		{
			params,
		},
	);

	return response.data.data;
};

export const unclaimedInvitesQueries = {
	all: () => [...inviteManagementQueries.all(), "unclaimed-invites"] as const,

	invites: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: UnclaimedInvitesQueryParams = {}) => {
		const params: UnclaimedInvitesQueryParams = {
			page,
			limit,
			...others,
		};
		return queryOptions({
			queryKey: [
				...unclaimedInvitesQueries.all(),
				"invites",
				params,
			] as const,
			queryFn: () => fetchInvites(params),
			meta: {
				onError: () => "Error fetching unclaimed invites",
			},
		});
	},
};
