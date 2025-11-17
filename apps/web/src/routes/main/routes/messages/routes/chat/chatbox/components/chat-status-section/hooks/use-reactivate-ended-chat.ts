/** @format */

import {
	chatSocket,
	EventEmitResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "@/routes/main/routes/messages/constants";
import { useMutation } from "@tanstack/react-query";
import { useChatRoom } from "../../../../chat-room-context";
import { chatQueries } from "../../../../query-factory";
import { PendingChat } from "../../../../types";

export const useReactivateEndedChat = () => {
	const { roomId } = useChatRoom();
	return useMutation({
		mutationFn: async () => {
			if (!roomId) {
				throw new Error("Chat Room not ready");
			}
			const response = (await chatSocket
				.timeout(EVENT_EMIT_TIMEOUT)
				.emitWithAck("chat:retry-ended", {
					chatId: roomId,
				})) as EventEmitResponse<"chat:retry-ended">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
			return roomId;
		},
		onSuccess: (roomId, _variables, _, { client }) => {
			const queryKey = chatQueries.chatDetails(roomId).queryKey;
			client.setQueryData(queryKey, (old) => {
				const canReactivate = old && old.status === "ENDED";
				if (!canReactivate) {
					return old;
				}

				const { closedBy: _, ...oldDetails } = old;
				return {
					...oldDetails,
					status: "PENDING",
				} satisfies PendingChat;
			});
		},
		// onError: caller should handle errors
	});
};
