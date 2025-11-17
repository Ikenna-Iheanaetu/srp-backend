/** @format */

import {
	chatSocket,
	EventEmitData,
	EventEmitResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "@/routes/main/routes/messages/constants";
import { useMutation } from "@tanstack/react-query";
import { href, useNavigate } from "react-router";
import { chatQueries } from "../../../../query-factory";
import { EndedByMeChat } from "../../../../types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

/** For user to explicitly close/end an active chat */
export const useEndChat = () => {
	const navigate = useNavigate();
	return useMutation({
		mutationFn: async (data: EventEmitData<"chat:end">) => {
			const response = (await chatSocket
				.timeout(EVENT_EMIT_TIMEOUT)
				.emitWithAck(
					"chat:end",
					data,
				)) as EventEmitResponse<"chat:end">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
		},
		onSuccess: async (_data, { chatId }, _, { client }) => {
			const { queryKey } = chatQueries.chatDetails(chatId);
			client.setQueryData(queryKey, (old) => {
				const canTransitionToClosed = old && old.status === "ACCEPTED";
				if (!canTransitionToClosed) {
					return old;
				}

				const { expiresAt: _, ...oldDetails } = old;
				return {
					...oldDetails,
					status: "ENDED",
					closedBy: "ME",
				} satisfies EndedByMeChat;
			});

			await navigate(href("/messages"));
		},
		onError: (error) => {
			toast.error("Unable to end chat", {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
