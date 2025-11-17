/** @format */

import { queryOptions } from "@tanstack/react-query";
import apiAxiosInstance from "@/lib/axios-instance";
import type { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { Request, TimelineEvent } from "./index/components/types";

export interface RequestQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	requestDate?: string;
}

export interface PaginatedServerResponse<T> {
	data: T[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// Backend response types
interface RequestItemResponse {
	id: string;
	chatId: string;
	dateTime: string;
	requestId: string;
	initiator: "player" | "company";
	initiatorName: string;
	recipient: "player" | "company";
	recipientName: string;
	status: string;
}


const fetchRequests = async (
	params: RequestQueryParams
): Promise<PaginatedServerResponse<Request>> => {
	try {
		const response = await apiAxiosInstance.get<
			ApiSuccessResponse<{
				hasData: true;
				data: {
					data: RequestItemResponse[];
					meta: {
						total: number;
						totalPages: number;
						page: number;
						limit: number;
					};
				};
			}>
		>("/admin/requests", {
			params: {
				page: params.page,
				limit: params.limit,
				search: params.search,
				status: params.status && params.status !== "all" ? params.status : undefined,
				requestDate: params.requestDate,
			},
		});

		const requestsData = response.data.data.data;
		const meta = response.data.data.meta;

		return {
			data: requestsData.map((item) => ({
				id: item.id,
				chatId: item.chatId,
				requestId: item.requestId,
				dateTime: item.dateTime,
				initiator: {
					id: "", // Not provided by backend
					name: item.initiatorName,
					type: item.initiator,
				},
				recipient: {
					id: "", // Not provided by backend
					name: item.recipientName,
					type: item.recipient,
				},
				status: item.status as "Pending" | "Hired" | "Closed" | "Cancelled",
			})),
			meta,
		};
	} catch (error) {
		console.error("Error fetching requests:", error);
		throw error;
	}
};

const fetchRequestDetails = async (chatId: string): Promise<TimelineEvent[]> => {
	try {
		const response = await apiAxiosInstance.get<
			ApiSuccessResponse<{
				hasData: true;
				data: Array<{
					id: string;
					description: string;
					createdAt: string;
				}>;
			}>
		>(`/admin/chat/${chatId}/timeline`);

		const timelineData = response.data.data;

		const timeline: TimelineEvent[] = timelineData.map((event) => ({
			id: event.id,
			description: event.description,
			timestamp: event.createdAt,
			type: getEventTypeFromDescription(event.description),
		}));

		return timeline;
	} catch (error) {
		console.error("Error fetching request details:", error);
		throw error;
	}
};

function getEventTypeFromDescription(
	description: string
): "success" | "info" | "warning" | "error" {
	const lowerDesc = description.toLowerCase();
	
	if (
		lowerDesc.includes("accepted") ||
		lowerDesc.includes("hired") ||
		lowerDesc.includes("ended")
	) {
		return "success";
	}
	
	if (lowerDesc.includes("cancelled")) {
		return "warning";
	}
	
	if (lowerDesc.includes("rejected") || lowerDesc.includes("declined")) {
		return "error";
	}
	
	return "info";
}

export const requestManagementQueries = {
	all: () => ["request-management"] as const,

	list: (params: RequestQueryParams) =>
		queryOptions({
			queryKey: [...requestManagementQueries.all(), "list", params] as const,
			queryFn: () => fetchRequests(params),
		}),

	details: (requestId: string) =>
		queryOptions({
			queryKey: [...requestManagementQueries.all(), "details", requestId] as const,
			queryFn: () => fetchRequestDetails(requestId),
		}),
};

