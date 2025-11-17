/** @format */

import { getErrorMessage } from "@/lib/utils";
import {
	chatSocket,
	EventEmitData,
	EventEmitResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "@/routes/main/routes/messages/constants";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatQueries } from "../../../../query-factory";
import { AcceptedChat } from "../../../../types";

export const useExtendChatPeriod = () => {
	return useMutation({
		mutationFn: async (data: EventEmitData<"chat:extend">) => {
			const response = (await chatSocket
				.timeout(EVENT_EMIT_TIMEOUT)
				.emitWithAck(
					"chat:extend",
					data,
				)) as EventEmitResponse<"chat:extend">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
			return response.data;
		},
		onSuccess: ({ expiresAt }, { chatId }, _, { client }) => {
			const queryKey = chatQueries.chatDetails(chatId).queryKey;
			client.setQueryData(queryKey, (old) => {
				const canTransitionToAccepted =
					old && old.status === "EXPIRED" && old.initiatedBy === "ME";
				if (!canTransitionToAccepted) {
					return old;
				}

				const { closedBy: _, ...oldDetails } = old;
				return {
					...oldDetails,
					status: "ACCEPTED",
					expiresAt,
				} satisfies AcceptedChat;
			});
		},
		onError: (error) => {
			toast.error("Unable to extend chat period", {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
