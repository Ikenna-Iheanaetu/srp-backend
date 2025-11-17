/** @format */

import { getErrorMessage } from "@/lib/utils";
import React from "react";
import { chatSocket, EventEmitResponse } from "../../chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "../../constants";
import { useRouteChatId } from "./hooks/use-route-chat-id";

type ChatRoomId = string | null;

interface ChatRoomContextType {
	/**
	 * Separates the user's intended `chatId` from the server-confirmed
	 * `chatId` (state). This decouples UI intent from network reality,
	 * ensuring listeners activate only after the asynchronous Socket.IO ACK
	 * confirms the room switch is complete.
	 */
	roomId: ChatRoomId;
}

const ChatRoomContext = React.createContext<ChatRoomContextType | null>(null);

export const ChatRoomProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const chatId = useRouteChatId();

	const [roomId, setRoomId] = React.useState<ChatRoomId>(null);

	const prevChatIdRef = React.useRef(chatId);

	const joinedPreviouslyRef = React.useRef(false);
	const onJoinChat = React.useEffectEvent(async (chatId: string) => {
		try {
			setRoomId(null);
			const response = (await chatSocket
				.timeout(
					EVENT_EMIT_TIMEOUT *
						2 /* Backend requested I increase the timeout */,
				)
				.emitWithAck("chat:join", {
					chatId,
				})) as EventEmitResponse<"chat:join">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
			setRoomId(chatId);
			joinedPreviouslyRef.current = true;
		} catch (error) {
			console.error(
				joinedPreviouslyRef.current
					? "Unable to rejoin chat"
					: "Failed to join chat",
				getErrorMessage(error),
			);
		}
	});

	React.useEffect(() => {
		// NOTE: This implementation assumes the api handles removing the user from the previous chat
		if (prevChatIdRef.current !== chatId) {
			joinedPreviouslyRef.current = false;
			prevChatIdRef.current = chatId;
		}
		if (chatSocket.connected) {
			void onJoinChat(chatId); // initial connection
		}
		const onSocketConnected = () => {
			void onJoinChat(chatId);
		};
		// Always rejoin chat on any reconnection
		chatSocket.on("connect", onSocketConnected);

		return () => {
			chatSocket.off("connect", onSocketConnected);
		};
	}, [chatId]);

	const ctxValue: ChatRoomContextType = React.useMemo(
		() => ({ roomId }),
		[roomId],
	);

	return <ChatRoomContext value={ctxValue}>{children}</ChatRoomContext>;
};

export const useChatRoom = () => {
	const ctx = React.use(ChatRoomContext);
	if (!ctx) {
		throw new Error("useChatRoom must be used within a ChatRoomProvider.");
	}
	return ctx;
};
