/** @format */

import { getErrorMessage } from "@/lib/utils";
import {
	chatSocket,
	EventEmitResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "@/routes/main/routes/messages/constants";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatQueries } from "../../../../query-factory";
import { DeclinedByMeChat } from "../../../../types";

export const useAcceptRequest = () => {
	return useMutation({
		mutationFn: async (data: { chatId: string }) => {
			const response = (await chatSocket
				.timeout(EVENT_EMIT_TIMEOUT)
				.emitWithAck(
					"chat:accept",
					data,
				)) as EventEmitResponse<"chat:accept">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
			return response.data;
		},
		onSuccess: (newChatDetails, { chatId }, _, { client }) => {
			const queryKey = chatQueries.chatDetails(chatId).queryKey;
			client.setQueryData(queryKey, (old) => {
				if (
					!old ||
					old.status !== "PENDING" ||
					old.initiatedBy !== "THEM"
				) {
					return old;
				}

				return {
					...old,
					...newChatDetails,
				};
			});
		},
		onError: (error) => {
			toast.error("Unable to accept chat request", {
				description: getErrorMessage(error),
			});
		},
	});
};

export const useDeclineRequest = () => {
	return useMutation({
		mutationFn: async (data: { chatId: string }) => {
			const response = (await chatSocket
				.timeout(EVENT_EMIT_TIMEOUT)
				.emitWithAck(
					"chat:decline",
					data,
				)) as EventEmitResponse<"chat:decline">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
			return response.data;
		},
		onSuccess: (newChatDetails, { chatId }, _, { client }) => {
			const queryKey = chatQueries.chatDetails(chatId).queryKey;
			client.setQueryData(queryKey, (old) => {
				if (
					!old ||
					old.status !== "PENDING" ||
					old.initiatedBy !== "THEM"
				) {
					return old;
				}

				return {
					...old,
					...newChatDetails,
					initiatedBy: "THEM",
					closedBy: "ME",
				} satisfies DeclinedByMeChat;
			});
		},
		onError: (error) => {
			toast.error("Unable to decline chat request", {
				description: getErrorMessage(error),
			});
		},
	});
};
