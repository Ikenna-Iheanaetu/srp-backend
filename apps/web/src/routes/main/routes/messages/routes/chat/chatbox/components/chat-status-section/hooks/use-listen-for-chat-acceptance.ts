/** @format */

import {
	chatSocket,
	EventReceiveResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useChatRoom } from "../../../../chat-room-context";
import { useChatDetails } from "../../../../hooks/use-chat-details";
import { chatQueries } from "../../../../query-factory";
import { AcceptedChat, DeclinedByThemChat } from "../../../../types";

export const useListenForChatAcceptance = () => {
	const { data: chatDetails } = useChatDetails();
	const { roomId } = useChatRoom();
	const canEnableListeners =
		!!roomId &&
		chatDetails?.initiatedBy === "ME" &&
		chatDetails.status === "PENDING";

	const queryClient = useQueryClient();

	const onAccepted = React.useEffectEvent(
		({ chatId, expiresAt }: EventReceiveResponse<"chat:accepted">) => {
			if (chatId !== roomId) {
				return;
			}

			const queryKey = chatQueries.chatDetails(chatId).queryKey;
			queryClient.setQueryData(queryKey, (old) => {
				if (
					!old ||
					(old.status !== "PENDING" && old.initiatedBy !== "ME")
				) {
					return;
				}

				const { closedBy: _, ...oldDetails } = old;
				return {
					...oldDetails,
					status: "ACCEPTED",
					expiresAt,
				} satisfies AcceptedChat;
			});
		},
	);

	const onDeclined = React.useEffectEvent(
		({ chatId }: EventReceiveResponse<"chat:declined">) => {
			if (chatId !== roomId) {
				return;
			}

			const queryKey = chatQueries.chatDetails(chatId).queryKey;
			queryClient.setQueryData(queryKey, (old) => {
				if (
					!old ||
					(old.status !== "PENDING" && old.initiatedBy !== "ME")
				) {
					return;
				}

				const { expiresAt: _, ...oldDetails } = old;
				return {
					...oldDetails,
					status: "DECLINED",
					initiatedBy: "ME",
					closedBy: "THEM",
				} satisfies DeclinedByThemChat;
			});
		},
	);

	React.useEffect(() => {
		if (!canEnableListeners) {
			return;
		}

		chatSocket.on("chat:accepted", onAccepted);
		chatSocket.on("chat:declined", onDeclined);

		return () => {
			chatSocket.off("chat:accepted", onAccepted);
			chatSocket.off("chat:declined", onDeclined);
		};
	}, [canEnableListeners]);
};
