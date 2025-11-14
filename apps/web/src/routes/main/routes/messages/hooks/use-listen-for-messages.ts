/** @format */

import { calculateNewMeta } from "@/lib/helper-functions/pagination";
import {
	chatSocket,
	EventReceiveResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { chatQueries } from "../routes/chat/query-factory";
import { ApiChatMessageByMe } from "../routes/chat/types";

/**
 * Handles listening for server-to-client message events and updates the chat messages cache.
 */
export const useListenForMessageUpdates = () => {
	const queryClient = useQueryClient();

	const onReceive = React.useEffectEvent(
		({
			chatId,
			message: newMessage,
		}: EventReceiveResponse<"message:receive">) => {
			const messagesQueryKey = chatQueries.infiniteMessages({
				chatId,
			}).queryKey;
			queryClient.setQueryData(messagesQueryKey, (old) => {
				if (!old) return old;

				const newPages = [...old.pages];
				const firstPage = newPages[0];

				if (firstPage) {
					// Prepend the new message to the first page's data
					const newData = [newMessage, ...firstPage.data];
					newPages[0] = {
						...firstPage,
						data: newData,
						meta: calculateNewMeta(newData.length, firstPage.meta),
					};
				}

				return { ...old, pages: newPages };
			});
		},
	);

	const onRead = React.useEffectEvent(
		({ chatId, messageId }: EventReceiveResponse<"message:read">) => {
			const messagesQueryKey = chatQueries.infiniteMessages({
				chatId,
			}).queryKey;

			queryClient.setQueryData(messagesQueryKey, (old) => {
				if (!old) {
					return old;
				}

				const newPages = old.pages.map((page) => ({
					...page,
					data: page.data.map((message) => {
						const canTransitionToRead =
							message.id === messageId &&
							message.from === "ME" &&
							message.status !== "READ";

						if (canTransitionToRead) {
							return {
								...message,
								status: "READ",
							} satisfies ApiChatMessageByMe;
						}
						return message;
					}),
				}));

				return { ...old, pages: newPages };
			});
		},
	);

	const onDelivered = React.useEffectEvent(
		({ chatId, messageId }: EventReceiveResponse<"message:delivered">) => {
			const messagesQueryKey = chatQueries.infiniteMessages({
				chatId,
			}).queryKey;

			queryClient.setQueryData(messagesQueryKey, (old) => {
				if (!old) {
					return old;
				}

				const newPages = old.pages.map((page) => ({
					...page,
					data: page.data.map((message) => {
						const canTransition =
							message.id === messageId &&
							message.from === "ME" &&
							message.status !== "DELIVERED";

						if (canTransition) {
							return {
								...message,
								status: "DELIVERED",
							} satisfies ApiChatMessageByMe;
						}
						return message;
					}),
				}));

				return { ...old, pages: newPages };
			});
		},
	);

	React.useEffect(() => {
		chatSocket.on("message:receive", onReceive);
		chatSocket.on("message:read", onRead);
		chatSocket.on("message:delivered", onDelivered);

		return () => {
			chatSocket.off("message:receive", onReceive);
			chatSocket.off("message:read", onRead);
			chatSocket.off("message:delivered", onDelivered);
		};
	}, []);
};
