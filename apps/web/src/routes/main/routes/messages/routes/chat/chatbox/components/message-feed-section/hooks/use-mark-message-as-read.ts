/** @format */

import {
	chatSocket,
	EventEmitResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "@/routes/main/routes/messages/constants";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useChatRoom } from "../../../../chat-room-context";
import { ChatItem } from "../../../../chats-list/types";
import { useChatsListQueryConfig } from "../../../../chats-list/use-chats-list-query-config";
import { useChatMessagesQueryConfig } from "../../../../hooks/use-chat-messages-query-config";
import { ApiChatMessageByThem, ChatMessage } from "../../../../types";
import { isClientOnlyMessage } from "../../../../utils";

const canBeMarkedAsRead = (
	message: ChatMessage,
): message is ApiChatMessageByThem & { status: "DELIVERED" } =>
	!isClientOnlyMessage(message) &&
	message.from === "THEM" &&
	message.status === "DELIVERED";

export const useMarkMessageAsRead = (message: ChatMessage) => {
	const { roomId } = useChatRoom();
	const queryClient = useQueryClient();
	const {
		queryOptions: { queryKey: chatMsgsQueryKey },
	} = useChatMessagesQueryConfig();

	const {
		queryOptions: { queryKey: chatsListQueryKey },
	} = useChatsListQueryConfig();
	const onSeen = React.useEffectEvent(async () => {
		if (!roomId) {
			return;
		}

		const messageId = message.id;
		const response = (await chatSocket
			.timeout(EVENT_EMIT_TIMEOUT)
			.emitWithAck("message:read", {
				chatId: roomId,
				messageId,
			})) as EventEmitResponse<"message:read">;

		if (
			response /* 
            TODO: Restore this when backend updates
            response.success */
		) {
			// Mark the message as read
			queryClient.setQueryData(chatMsgsQueryKey, (old) => {
				if (!old) {
					return old;
				}

				const newPages = old.pages.map((page) => ({
					...page,
					data: page.data.map((message) => {
						const canTransitionToRead =
							message.id === messageId &&
							canBeMarkedAsRead(message);

						if (canTransitionToRead) {
							return {
								...message,
								status: "READ",
							} satisfies ApiChatMessageByThem;
						}
						return message;
					}),
				}));

				return { ...old, pages: newPages };
			});
		}

		// decrement unread count for this chat in chats list
		queryClient.setQueryData(chatsListQueryKey, (old) => {
			if (!old) {
				return old;
			}

			const newPages = old.pages.map((page) => ({
				...page,
				data: page.data.map((item) => {
					if (item.id !== roomId) {
						return item;
					}

					if (
						item.unreadCount === 0 ||
						item.unreadCount === undefined
					) {
						return item;
					}

					const reducedUnreadCount = Math.max(
						0,
						item.unreadCount - 1,
					);

					return {
						...item,
						...(reducedUnreadCount === 0
							? { unreadCount: 0, status: "READ" }
							: {
									unreadCount: reducedUnreadCount,
									status: "UNREAD",
								}),
					} satisfies ChatItem;
				}),
			}));

			return {
				...old,
				pages: newPages,
			};
		});
	});

	const canMarkAsRead = roomId && canBeMarkedAsRead(message);
	const setOnSeenRef: React.RefCallback<HTMLElement> = React.useCallback(
		(targetElement) => {
			const canObserve = canMarkAsRead && targetElement;
			if (!canObserve) {
				return;
			}

			const intersectOptions: IntersectionObserverInit = {
				root: null,
				rootMargin: "0px",
				threshold: 0.1,
			};

			const observer = new IntersectionObserver((entries, observer) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const isTrulyVisible = targetElement.checkVisibility({
							checkOpacity: true,
							checkVisibilityCSS: true,
							contentVisibilityAuto: true,
							opacityProperty: true,
							visibilityProperty: true,
						} satisfies HasKeysOf<CheckVisibilityOptions, true>);

						if (isTrulyVisible) {
							void onSeen();

							observer.unobserve(entry.target);
						}
					}
				});
			}, intersectOptions);

			observer.observe(targetElement);

			return () => {
				observer.disconnect();
			};
		},
		[canMarkAsRead],
	);

	return setOnSeenRef;
};
