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
import { AcceptedChat, ChatDetails, ExpiredChat } from "../../../../types";

export const useListenForChatExpiredUpdates = () => {
	useListenForChatExpired();
	useListenForChatExtended();
};

const useListenForChatExpired = () => {
	const { roomId } = useChatRoom();
	const queryClient = useQueryClient();

	const onExpired = React.useEffectEvent(
		({ chatId }: EventReceiveResponse<"chat:expired">) => {
			if (chatId !== roomId) {
				return;
			}

			const { queryKey } = chatQueries.chatDetails(chatId);
			queryClient.setQueryData(queryKey, (old) => {
				const canTransitionToExpired = old && old.status === "ACCEPTED";
				if (!canTransitionToExpired) {
					return;
				}

				const { expiresAt: _, ...oldDetails } = old;

				return {
					...oldDetails,
					status: "EXPIRED",
					closedBy: "EXPIRATION",
				} satisfies ExpiredChat;
			});
		},
	);

	const { data: chatDetails } = useChatDetails();
	const canListen = roomId && chatDetails?.status === "ACCEPTED";
	React.useEffect(() => {
		if (!canListen) {
			return;
		}

		chatSocket.on("chat:expired", onExpired);

		return () => {
			chatSocket.off("chat:expired", onExpired);
		};
	}, [canListen]);
};

const canBeExtended = (
	chat: ChatDetails,
): chat is ExpiredChat & { initiatedBy: "THEM" } =>
	chat.status === "EXPIRED" && chat.initiatedBy === "THEM";

const useListenForChatExtended = () => {
	const { roomId } = useChatRoom();
	const queryClient = useQueryClient();

	const onExtended = React.useEffectEvent(
		({ chatId, expiresAt }: EventReceiveResponse<"chat:extended">) => {
			if (chatId !== roomId) {
				return;
			}

			const { queryKey } = chatQueries.chatDetails(chatId);
			queryClient.setQueryData(queryKey, (old) => {
				const canTransitionToAccepted = old && canBeExtended(old);
				if (!canTransitionToAccepted) {
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

	const { data: chatDetails } = useChatDetails();
	const canListen = roomId && chatDetails && canBeExtended(chatDetails);
	React.useEffect(() => {
		if (!canListen) {
			return;
		}

		chatSocket.on("chat:extended", onExtended);

		return () => {
			chatSocket.off("chat:extended", onExtended);
		};
	}, [canListen]);
};
