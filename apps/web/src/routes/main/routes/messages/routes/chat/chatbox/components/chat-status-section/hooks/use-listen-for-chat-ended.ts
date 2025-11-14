/** @format */

import { useQueryClient } from "@tanstack/react-query";
import { useChatRoom } from "../../../../chat-room-context";
import React from "react";
import {
	chatSocket,
	EventReceiveResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { chatQueries } from "../../../../query-factory";
import { EndedByThemChat } from "../../../../types";
import { useChatDetails } from "../../../../hooks/use-chat-details";

export const useListenForChatEnded = () => {
	const { roomId } = useChatRoom();
	const queryClient = useQueryClient();

	const onClosed = React.useEffectEvent(
		({ chatId }: EventReceiveResponse<"chat:ended">) => {
			if (chatId !== roomId) {
				return;
			}

			const { queryKey } = chatQueries.chatDetails(chatId);
			queryClient.setQueryData(queryKey, (old) => {
				const canTransitionToClosed = old && old.status === "ACCEPTED";
				if (!canTransitionToClosed) {
					return;
				}

				const { expiresAt: _, ...oldDetails } = old;

				return {
					...oldDetails,
					status: "ENDED",
					closedBy: "THEM",
				} satisfies EndedByThemChat;
			});
		},
	);

	const { data: chatDetails } = useChatDetails();
	const canListen = roomId && chatDetails?.status === "ACCEPTED";
	React.useEffect(() => {
		if (!canListen) {
			return;
		}

		chatSocket.on("chat:ended", onClosed);

		return () => {
			chatSocket.off("chat:ended", onClosed);
		};
	}, [canListen]);
};
