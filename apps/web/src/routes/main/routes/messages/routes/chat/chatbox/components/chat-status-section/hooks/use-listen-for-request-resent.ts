/**
 * Listens for when the recipient resends another request for the chat you declined.
 *
 * @format
 */

import { useQueryClient } from "@tanstack/react-query";
import { useChatRoom } from "../../../../chat-room-context";
import React from "react";
import {
	chatSocket,
	EventReceiveResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { chatQueries } from "../../../../query-factory";
import { PendingByThemChat } from "../../../../types";
import { useChatDetails } from "../../../../hooks/use-chat-details";

export const useListenForRequestResent = () => {
	const { data: chatDetails } = useChatDetails();
	const { roomId } = useChatRoom();
	const queryClient = useQueryClient();

	const onResent = React.useEffectEvent(
		({ chatId }: EventReceiveResponse<"chat:request-resent">) => {
			if (chatId !== roomId) {
				return;
			}

			const { queryKey } = chatQueries.chatDetails(chatId);
			queryClient.setQueryData(queryKey, (old) => {
				const canTransitionToPending =
					old &&
					old.initiatedBy === "THEM" &&
					old.status === "DECLINED";
				if (!canTransitionToPending) {
					return old;
				}

				const { closedBy: _, ...oldDetails } = old;
				return {
					...oldDetails,
					status: "PENDING",
				} satisfies PendingByThemChat;
			});
		},
	);
	const canListen =
		roomId &&
		chatDetails?.status === "DECLINED" &&
		chatDetails.initiatedBy === "THEM";
	React.useEffect(() => {
		if (!canListen) {
			return;
		}

		chatSocket.on("chat:request-resent", onResent);

		return () => {
			chatSocket.off("chat:request-resent", onResent);
		};
	}, [canListen]);
};
