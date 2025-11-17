/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ChatRecipient } from "../chat/types";

interface RecipientsQueryParams extends ServerPaginationParams {
	search?: string;
}

type PaginatedRecipients = PaginatedServerResponse<ChatRecipient>;
export type RecipientsApiResponse = ApiSuccessResponse<{
	data: PaginatedRecipients;
}>;

export const NEW_RECIPIENTS_ENDPOINT = "/chats/suggested";
const fetchInfiniteRecipients = async (
	params: RecipientsQueryParams,
): Promise<PaginatedRecipients> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: PaginatedRecipients }>
	>(NEW_RECIPIENTS_ENDPOINT, {
		params,
		skipUserTypePrefix: true,
	});

	return response.data.data;
};

interface DirectRecipientsResponseData {
	profiles: ChatRecipient[];
	failed: { id: string; reason: string }[];
}
const fetchRecipients = async (
	ids: string[],
): Promise<DirectRecipientsResponseData> => {
	const response = await apiAxiosInstance.post<
		ApiSuccessResponse<{ data: DirectRecipientsResponseData }>
	>(
		`/chats/suggested/list`,
		{ ids },
		{
			skipUserTypePrefix: true,
		},
	);
	return response.data.data;
};

export const newChatRecipientsQueries = {
	all: () => ["new-chat-recipients"] as const,

	recipients: <TId extends string | string[]>(ids: TId) => {
		type ResponseType = TId extends string
			? ChatRecipient
			: ChatRecipient[];
		return queryOptions({
			queryKey: [
				...newChatRecipientsQueries.all(),
				"recipients",
				ids,
			] as const,
			queryFn: async (): Promise<ResponseType> => {
				const isSingleId = typeof ids === "string";
				const idArray: string[] = isSingleId ? [ids] : ids;
				const { profiles: fetchedRecipients } =
					await fetchRecipients(idArray);
				if (isSingleId) {
					const singleRecipient = fetchedRecipients[0];
					if (!singleRecipient) {
						throw new Error("Recipient not found");
					}
					return singleRecipient as ResponseType;
				}
				return fetchedRecipients as ResponseType;
			},
		});
	},

	inifiniteRecipients: ({
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: SafeOmit<RecipientsQueryParams, "page"> = {}) => {
		const params = { limit, ...others };

		return infiniteQueryOptions({
			queryKey: [
				...newChatRecipientsQueries.all(),
				"infinite-recipients",
				params,
			] as const,
			queryFn: ({ pageParam }) =>
				fetchInfiniteRecipients({ ...params, page: pageParam }),
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
