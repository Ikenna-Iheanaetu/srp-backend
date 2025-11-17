/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ApiChatMessage, ChatDetails, RenderableMsgFromApi } from "./types";
import { ChatsListSearchParams } from "./chats-list/schemas";
import { ChatItem } from "./chats-list/types";

type PaginatedMessages = PaginatedServerResponse<
	| ApiChatMessage
	| RenderableMsgFromApi /* We use Tanstack query for stable rendering */
>;

interface ChatMessagesQueryParams extends ServerPaginationParams {
	chatId: string;
}

const fetchChatMessages = async ({
	chatId,
	...params
}: ChatMessagesQueryParams): Promise<PaginatedMessages> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: PaginatedMessages }>
	>(`/chats/${chatId}/messages`, {
		params,
		skipUserTypePrefix: true,
	});

	return response.data.data;

	// const data = [
	// 	// --- 6. Today - October 17, 2025 (Newest Group) ---
	// 	{
	// 		id: "chat-018",
	// 		content: "Today message 4 (latest). Includes an image attachment.",
	// 		attachments: [
	// 			{
	// 				name: "Latest_Photo.jpg",
	// 				url: "https://placehold.co/600x400/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/jpeg",
	// 				size: 152000, // 152 KB
	// 			},
	// 		],
	// 		timestamp: "2025-10-17T08:50:00Z", // Renders first
	// 		from: "THEM",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-017",
	// 		content: "Today message 3. I am sending a couple of documents.",
	// 		attachments: [
	// 			{
	// 				name: "Project_Proposal.pdf",
	// 				url: "https://example.com/files/project-proposal.pdf",
	// 				category: "DOCUMENT",
	// 				mimeType: "application/pdf",
	// 				size: 850000, // 850 KB
	// 			},
	// 			{
	// 				name: "Meeting_Notes.docx",
	// 				url: "https://example.com/files/meeting-notes.docx",
	// 				category: "DOCUMENT",
	// 				mimeType:
	// 					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	// 				size: 120000, // 120 KB
	// 			},
	// 		],
	// 		timestamp: "2025-10-17T08:45:00Z",
	// 		from: "ME",
	// 		status: "READ",
	// 	},
	// 	{
	// 		id: "chat-016",
	// 		content: "Today message 2. No attachments here.",
	// 		attachments: [],
	// 		timestamp: "2025-10-17T08:40:00Z",
	// 		from: "ME",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-015",
	// 		content:
	// 			"Today message 1 (morning). Check out this video and audio clip!",
	// 		attachments: [
	// 			{
	// 				name: "Quick_Intro.mp4",
	// 				url: "https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4",
	// 				category: "VIDEO",
	// 				mimeType: "video/mp4",
	// 				size: 1048576, // 1 MB
	// 			},
	// 			{
	// 				name: "Voice_Note_01.mp3",
	// 				url: "https://example.com/audio/voicenote.mp3",
	// 				category: "AUDIO",
	// 				mimeType: "audio/mpeg",
	// 				size: 350000, // 350 KB
	// 			},
	// 			{
	// 				name: "Screenshot.png",
	// 				url: "https://placehold.co/800x600/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/png",
	// 				size: 250000, // 250 KB
	// 			},
	// 		],
	// 		timestamp: "2025-10-17T08:30:00Z",
	// 		from: "ME",
	// 		status: "DELIVERED",
	// 	},

	// 	// --- 5. Yesterday - October 16, 2025 ---
	// 	{
	// 		id: "chat-014",
	// 		content: "Yesterday message 3. This one has five attachments!",
	// 		attachments: [
	// 			{
	// 				name: "Chart_Data.xlsx",
	// 				url: "https://example.com/data/chart_data.xlsx",
	// 				category: "DOCUMENT",
	// 				mimeType:
	// 					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	// 				size: 30000,
	// 			},
	// 			{
	// 				name: "Team_Photo_1.jpg",
	// 				url: "https://placehold.co/1000x500/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/jpeg",
	// 				size: 180000,
	// 			},
	// 			{
	// 				name: "Team_Photo_2.jpg",
	// 				url: "https://placehold.co/500x1000/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/jpeg",
	// 				size: 210000,
	// 			},
	// 			{
	// 				name: "Team_Photo_3.png",
	// 				url: "https://placehold.co/400x400/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/png",
	// 				size: 115000,
	// 			},
	// 			{
	// 				name: "Presentation.pptx",
	// 				url: "https://example.com/docs/presentation.pptx",
	// 				category: "DOCUMENT",
	// 				mimeType:
	// 					"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	// 				size: 5000000, // 5 MB
	// 			},
	// 		],
	// 		timestamp: "2025-10-16T18:02:00Z",
	// 		from: "THEM",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-013",
	// 		content: "Yesterday message 2. Just a quick doc.",
	// 		attachments: [
	// 			{
	// 				name: "ReadMe.txt",
	// 				url: "https://raw.githubusercontent.com/rust-lang/rust/master/README.md",
	// 				category: "DOCUMENT",
	// 				mimeType: "text/plain",
	// 				size: 4500,
	// 			},
	// 		],
	// 		timestamp: "2025-10-16T18:01:00Z",
	// 		from: "THEM",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-012",
	// 		content: "Yesterday message 1 (evening).",
	// 		attachments: [],
	// 		timestamp: "2025-10-16T18:00:00Z",
	// 		from: "ME",
	// 		status: "SENT",
	// 	},

	// 	// --- 4. Last Week - October 10-15, 2025 (2 to 7 days ago) ---
	// 	{
	// 		id: "chat-011",
	// 		content: "Last Week message 3 (2 days ago). Two related images.",
	// 		attachments: [
	// 			{
	// 				name: "Diagram_A.svg",
	// 				url: "https://example.com/assets/diagram_a.svg",
	// 				category: "IMAGE",
	// 				mimeType: "image/svg+xml",
	// 				size: 80000,
	// 			},
	// 			{
	// 				name: "Diagram_B.svg",
	// 				url: "https://example.com/assets/diagram_b.svg",
	// 				category: "IMAGE",
	// 				mimeType: "image/svg+xml",
	// 				size: 95000,
	// 			},
	// 		],
	// 		timestamp: "2025-10-15T11:00:00Z", // 2 days ago
	// 		from: "ME",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-010",
	// 		content: "Last Week message 2 (4 days ago). Important video clip.",
	// 		attachments: [
	// 			{
	// 				name: "Quick_Update.mov",
	// 				url: "https://example.com/video/quick_update.mov",
	// 				category: "VIDEO",
	// 				mimeType: "video/quicktime",
	// 				size: 2500000, // 2.5 MB
	// 			},
	// 		],
	// 		timestamp: "2025-10-13T10:00:00Z",
	// 		from: "THEM",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-009",
	// 		content: "Last Week message 1 (6 days ago). Nothing attached.",
	// 		attachments: [],
	// 		timestamp: "2025-10-11T09:00:00Z",
	// 		from: "THEM",
	// 		status: "DELIVERED",
	// 	},

	// 	// --- 3. Older (within the past month) - September 17 - October 9 (8 to 30 days ago) ---
	// 	{
	// 		id: "chat-008",
	// 		content:
	// 			"Message 2, confirms 'Older (past month)' group (27 days ago). Four images from the event.",
	// 		attachments: [
	// 			{
	// 				name: "Event_Photo_1.jpg",
	// 				url: "https://placehold.co/400x400/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/jpeg",
	// 				size: 150000,
	// 			},
	// 			{
	// 				name: "Event_Photo_2.jpg",
	// 				url: "https://placehold.co/400x400/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/jpeg",
	// 				size: 160000,
	// 			},
	// 			{
	// 				name: "Event_Photo_3.jpg",
	// 				url: "https://placehold.co/400x400/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/jpeg",
	// 				size: 145000,
	// 			},
	// 			{
	// 				name: "Event_Photo_4.jpg",
	// 				url: "https://placehold.co/400x400/png",
	// 				category: "IMAGE",
	// 				mimeType: "image/jpeg",
	// 				size: 170000,
	// 			},
	// 		],
	// 		timestamp: "2025-09-20T15:00:00Z",
	// 		from: "THEM",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-007",
	// 		content:
	// 			"Message 1, falls into 'Older (past month)' group (30 days ago). One important PDF.",
	// 		attachments: [
	// 			{
	// 				name: "Contract_Final.pdf",
	// 				url: "https://example.com/documents/contract_v2.pdf",
	// 				category: "DOCUMENT",
	// 				mimeType: "application/pdf",
	// 				size: 450000,
	// 			},
	// 		],
	// 		timestamp: "2025-09-17T14:30:00Z",
	// 		from: "ME",
	// 		status: "DELIVERED",
	// 	},

	// 	// --- 2. Older (Organized by Active Months) - September 2025 (<= 30 days ago) ---
	// 	{
	// 		id: "chat-006",
	// 		content: "Older message 3 from September. Sending one audio file.",
	// 		attachments: [
	// 			{
	// 				name: "Feedback_Clip.ogg",
	// 				url: "https://example.com/audio/feedback.ogg",
	// 				category: "AUDIO",
	// 				mimeType: "audio/ogg",
	// 				size: 550000,
	// 			},
	// 		],
	// 		timestamp: "2025-09-15T14:00:00Z",
	// 		from: "ME",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-005",
	// 		content: "Older message 2 from September.",
	// 		attachments: [],
	// 		timestamp: "2025-09-05T13:00:00Z",
	// 		from: "ME",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-004",
	// 		content: "Older message 1 from September. Three attachments here.",
	// 		attachments: [
	// 			{
	// 				name: "Report_Summary.csv",
	// 				url: "https://example.com/data/report_summary.csv",
	// 				category: "DOCUMENT",
	// 				mimeType: "text/csv",
	// 				size: 15000,
	// 			},
	// 			{
	// 				name: "Logo_Draft.ai",
	// 				url: "https://example.com/assets/logo_draft.ai",
	// 				category: "IMAGE",
	// 				mimeType: "application/postscript", // Using generic for .ai
	// 				size: 300000,
	// 			},
	// 			{
	// 				name: "Test_Video.webm",
	// 				url: "https://sample-videos.com/video123/webm/240/big_buck_bunny_240p_1mb.webm",
	// 				category: "VIDEO",
	// 				mimeType: "video/webm",
	// 				size: 1048576, // 1 MB
	// 			},
	// 		],
	// 		timestamp: "2025-09-01T12:00:00Z",
	// 		from: "THEM",
	// 		status: "DELIVERED",
	// 	},

	// 	// --- 1. Older (Organized by Active Months) - August 2025 (Oldest Group) ---
	// 	{
	// 		id: "chat-003",
	// 		content: "Older message 3 from August. Just one image.",
	// 		attachments: [
	// 			{
	// 				name: "Placeholder_Old.gif",
	// 				url: "https://placehold.co/300x200/gif",
	// 				category: "IMAGE",
	// 				mimeType: "image/gif",
	// 				size: 50000,
	// 			},
	// 		],
	// 		timestamp: "2025-08-30T11:00:00Z",
	// 		from: "THEM",
	// 		status: "DELIVERED",
	// 	},
	// 	{
	// 		id: "chat-002",
	// 		content: "Older message 2 from August. No attachments.",
	// 		attachments: [],
	// 		timestamp: "2025-08-15T10:00:45Z",
	// 		from: "ME",
	// 		status: "READ",
	// 	},
	// 	{
	// 		id: "chat-001",
	// 		content:
	// 			"Older message 1 from August. Sending a very large document.",
	// 		attachments: [
	// 			{
	// 				name: "Archive_Data.zip",
	// 				url: "https://example.com/archives/data_archive.zip",
	// 				category: "DOCUMENT",
	// 				mimeType: "application/zip",
	// 				size: 15728640, // 15 MB
	// 			},
	// 		],
	// 		timestamp: "2025-08-01T09:00:00Z",
	// 		from: "ME",
	// 		status: "READ",
	// 	},
	// ] satisfies ChatMessage[];
	// return {
	// 	data,
	// 	meta: {
	// 		total: data.length,
	// 		limit: data.length,
	// 		page: 1,
	// 		totalPages: 1,
	// 	},
	// };
};

const fetchChatDetails = async (chatId: string): Promise<ChatDetails> => {
	// TODO: Restore data fetching
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: ChatDetails }>
	>(`/chats/${chatId}`, {
		skipUserTypePrefix: true,
	});
	return response.data.data;

	// return {
	// 	id: "mmmm",
	// 	status: "EXPIRED",
	// 	initiatedBy: "ME",
	// 	closedBy: "EXPIRATION",
	// 	// expiresAt: "2025-11-20T18:00:00Z",
	// 	recipient: {
	// 		id: "user-456",
	// 		name: "Alex Johnson",
	// 		userType: "company",
	// 		avatar: "https://i.pravatar.cc/150",
	// 		location: "San Francisco, CA",
	// 		club: {
	// 			id: "ddd",
	// 			name: "Louch Deeem",
	// 		},
	// 	},
	// };
};

type ChatsListQueryParams = ServerPaginationParams &
	Partial<ChatsListSearchParams>;

type PaginatedChats = PaginatedServerResponse<ChatItem>;

type ChatsListApiResponse = ApiSuccessResponse<{
	data: PaginatedChats;
}>;

const CHATS_LIST_ENDPOINT = "/chats";

const fetchChats = async (
	params: ChatsListQueryParams,
): Promise<PaginatedChats> => {
	const response = await apiAxiosInstance.get<ChatsListApiResponse>(
		CHATS_LIST_ENDPOINT,
		{
			params,
			skipUserTypePrefix: true,
		},
	);

	return response.data.data;
};

const fetchUnattendedCount = async (): Promise<number> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: number }>
	>("/chats/unattended-count", {
		skipUserTypePrefix: true,
	});
	return response.data.data;
};

const chatQueries = {
	all: () => ["chat-queries"] as const,

	chatDetails: (chatId: string) => {
		return queryOptions({
			queryKey: [...chatQueries.all(), "chat-details", chatId] as const,
			queryFn: () => fetchChatDetails(chatId),
		});
	},

	unattendedCount: () => {
		return queryOptions({
			queryKey: [...chatQueries.all(), "unattended-count"] as const,
			queryFn: fetchUnattendedCount,
		});
	},

	infiniteChats: ({
		limit = DEFAULT_PAGE_SIZE,
		...others
	}: SafeOmit<ChatsListQueryParams, "page"> = {}) => {
		const params = { limit, ...others };

		return infiniteQueryOptions({
			queryKey: [...chatQueries.all(), "infinite-chats", params] as const,
			queryFn: ({ pageParam }) =>
				fetchChats({ ...params, page: pageParam }),
			initialPageParam: DEFAULT_PAGE_NUMBER,
			getNextPageParam: (lastPage) => {
				const nextPageNumber = lastPage.meta.page + 1;
				return nextPageNumber > lastPage.meta.totalPages
					? null
					: nextPageNumber;
			},
		});
	},

	infiniteMessages: ({
		limit = 20,
		...others
	}: SafeOmit<ChatMessagesQueryParams, "page">) => {
		const params = { limit, ...others };

		return infiniteQueryOptions({
			queryKey: [
				...chatQueries.all(),
				"infinite-messages",
				params,
			] as const,
			queryFn: ({ pageParam }) =>
				fetchChatMessages({ ...params, page: pageParam }),
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

export { chatQueries, CHATS_LIST_ENDPOINT };
export type { ChatsListApiResponse };
