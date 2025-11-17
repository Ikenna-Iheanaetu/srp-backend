/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { PaginatedServerResponse } from "@/types/pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { queryOptions } from "@tanstack/react-query";
import { inviteManagementQueries } from "../../query-factory";
import { InvitedUser, InvitedUserFilters } from "./columns";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

const INVITES_REQUEST_PATH = "/invites";

type InvitesToApproveQueryParams = TableQueryParams<
	InvitedUserFilters & { clubId: string }
>;

type PaginatedInvitedUser = PaginatedServerResponse<InvitedUser>;
type UnapproveInviteApiResponse = ApiSuccessResponse<{
	data: PaginatedInvitedUser;
}>;
const fetchInvites = async (
	params: InvitesToApproveQueryParams,
): Promise<PaginatedInvitedUser> => {
	const response = await apiAxiosInstance.get<UnapproveInviteApiResponse>(
		"/admin/affiliates/invites/unapproved",
		{
			params,
		},
	);

	return response.data.data;
};

const invitesToApproveQueries = {
	all: () =>
		[...inviteManagementQueries.all(), "invites-to-approve"] as const,

	invites: ({
		page = DEFAULT_PAGE_NUMBER,
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: InvitesToApproveQueryParams = {}) => {
		const params: InvitesToApproveQueryParams = { page, limit, ...others };
		return queryOptions({
			queryKey: [
				...invitesToApproveQueries.all(),
				"invites",
				params,
			] as const,
			queryFn: () => fetchInvites(params),
			meta: {
				onError: () => "Error fetching invites to approve",
			},
		});
	},
};

export { invitesToApproveQueries, INVITES_REQUEST_PATH };
