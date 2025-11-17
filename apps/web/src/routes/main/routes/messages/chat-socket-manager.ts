/** @format */

import {
	ApiErrorResponse,
	ApiSuccessResponse,
} from "@/lib/axios-instance/types";
import { getAuthStatusFromCookies } from "@/routes/auth/cookie-management/get-auth-status-helper";
import { io, Socket } from "socket.io-client";
import * as z from "zod/v4";
import { MessageForm } from "./routes/chat/chatbox/components/message-composer-section/form-schema";
import {
	AcceptedChat,
	ApiChatMessageByMe,
	ApiChatMessageByThem,
	DeclinedByMeChat,
	DeclinedByThemChat,
	EndedByThemChat,
	ExpiredChat,
	PendingByMeChat,
	PendingByThemChat,
	PendingChat,
} from "./routes/chat/types";

interface ServerToClientEvents {
	"message:receive": (data: {
		chatId: string;
		message: ApiChatMessageByThem;
	}) => void;
	"message:read": (data: { chatId: string; messageId: string }) => void;
	"message:delivered": (data: { chatId: string; messageId: string }) => void;
	"typing:start": (data: { chatId: string }) => void;
	"typing:stop": (data: { chatId: string }) => void;
	"chat:accepted": (data: AcceptedChat) => void;
	"chat:declined": (data: DeclinedByThemChat) => void;
	"chat:ended": (data: EndedByThemChat) => void;
	"chat:declined-retried": (data: PendingByThemChat) => void;
	"chat:ended-retried": (data: PendingChat) => void;
	"chat:expired-retried": (data: PendingChat) => void;
	"chat:expired": (data: ExpiredChat) => void;
	"chat:extended": (data: AcceptedChat) => void;
	"chat:request-received": (data: PendingByThemChat) => void;
	"chat:unattended-count": (data: number) => void;
}

type EventReceiveResponse<E extends keyof ServerToClientEvents> =
	ServerToClientEvents[E] extends (response: infer Response) => void
		? Response
		: never;

interface newMessageOnSend {
	message: MessageForm;
	chatId: string;
}

type DataForChatRequest = MessageForm & {
	recipientId: string;
};

interface ClientToServerEvents {
	"message:send": (
		data: {
			chatId: string;
			message: Pick<ApiChatMessageByMe, "content" | "attachments">;
		},
		callback: (
			response:
				| ApiSuccessResponse<{
						data: {
							message: ApiChatMessageByMe;
						};
				  }>
				| ApiErrorResponse,
		) => void,
	) => void;
	"message:read": (
		data: { chatId: string; messageId: string },
		callback: (response: ApiSuccessResponse | ApiErrorResponse) => void,
	) => void;
	"chat:request": (
		data: Pick<ApiChatMessageByMe, "content" | "attachments"> & {
			recipientId: string;
		},
		callback: (
			response:
				| ApiSuccessResponse<{
						data: {
							message: ApiChatMessageByMe;
							chat: PendingByMeChat;
						};
				  }>
				| ApiErrorResponse,
		) => void,
	) => void;
	"chat:retry-declined": (
		data: { chatId: string },
		callback: (response: ApiSuccessResponse | ApiErrorResponse) => void,
	) => void;
	"chat:retry-ended": (
		data: { chatId: string },
		callback: (response: ApiSuccessResponse | ApiErrorResponse) => void,
	) => void;
	"chat:retry-expired": (
		data: { chatId: string },
		callback: (response: ApiSuccessResponse | ApiErrorResponse) => void,
	) => void;
	"chat:accept": (
		data: { chatId: string },
		callback: (
			response:
				| ApiSuccessResponse<{
						data: Pick<AcceptedChat, "expiresAt" | "status">;
				  }>
				| ApiErrorResponse,
		) => void,
	) => void;
	"chat:decline": (
		data: { chatId: string },
		callback: (
			response:
				| ApiSuccessResponse<{
						data: Pick<DeclinedByMeChat, "status">;
				  }>
				| ApiErrorResponse,
		) => void,
	) => void;
	"chat:end": (
		data: { chatId: string },
		callback: (response: ApiSuccessResponse | ApiErrorResponse) => void,
	) => void;
	"chat:join": (
		data: { chatId: string },
		callback: (response: ApiSuccessResponse | ApiErrorResponse) => void,
	) => void;
	"chat:leave": (
		data: { chatId: string },
		callback: (response: ApiSuccessResponse | ApiErrorResponse) => void,
	) => void;
	"chat:extend": (
		data: { chatId: string },
		callback: (
			response:
				| ApiSuccessResponse<{ data: Pick<AcceptedChat, "expiresAt"> }>
				| ApiErrorResponse,
		) => void,
	) => void;
	"typing:start": (data: { chatId: string }) => void;
	"typing:stop": (data: { chatId: string }) => void;
	heartbeat: () => void;
}

type EventEmitResponse<E extends keyof ClientToServerEvents> =
	ClientToServerEvents[E] extends (...args: infer Args) => void
		? Args extends [
				...rest: unknown[],
				callback: (response: infer Response) => void,
			]
			? Response
			: never
		: never;

type EventEmitData<E extends keyof ClientToServerEvents> =
	ClientToServerEvents[E] extends (...args: infer Args) => void
		? Args extends [data: infer Data, ...rest: unknown[]]
			? Data
			: never
		: never;

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const baseURL = z
	.string({
		error: "[chatSocket]: Invalid Environment variable 'VITE_API_URL'",
	})
	.parse(import.meta.env.VITE_API_URL);
const chatSocket: ChatSocket = io(baseURL + "/chat", {
	autoConnect: false,
});
chatSocket.auth = (cb) => {
	const authStatus = getAuthStatusFromCookies();
	if (!authStatus.isAuthenticated) {
		throw new Error("[chatSocket]: Invalid authentication status", {
			cause: authStatus,
		});
	}

	const { accessToken } = authStatus.cookies;
	const credentials = {
		headers: {
			authorization: `Bearer ${accessToken}`,
		},
	};

	cb(credentials);
};

export { chatSocket };

export type {
	DataForChatRequest,
	EventEmitData,
	EventEmitResponse,
	EventReceiveResponse,
	newMessageOnSend,
};
