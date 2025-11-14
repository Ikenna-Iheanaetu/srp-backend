/** @format */

import { useDebounceCallback } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { chatSocket } from "@/routes/main/routes/messages/chat-socket-manager";
import { MessageTextBox } from "@/routes/main/routes/messages/components/chat/message-composer";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useChatRoom } from "../../../../chat-room-context";
import { MessageForm } from "../form-schema";

const useEmitTypingStatus = () => {
	const isTypingRef = React.useRef(false);

	const { roomId } = useChatRoom();

	const emitStartTyping = React.useCallback(() => {
		if (!roomId) {
			return;
		}
		if (!isTypingRef.current) {
			isTypingRef.current = true;
			chatSocket.emit("typing:start", { chatId: roomId });
		}
	}, [roomId]);

	const emitStopTyping = React.useCallback(() => {
		if (!roomId) {
			return;
		}
		if (isTypingRef.current) {
			isTypingRef.current = false;
			chatSocket.emit("typing:stop", { chatId: roomId });
		}
	}, [roomId]);

	const TYPING_DELAY_MS = 2000;
	const debouncedEmitStopTyping = useDebounceCallback(
		emitStopTyping,
		TYPING_DELAY_MS,
	);

	const setTypingRef: React.RefCallback<HTMLTextAreaElement> =
		React.useCallback(
			(node) => {
				if (node) {
					const handleInput = () => {
						emitStartTyping();
						debouncedEmitStopTyping();
					};

					node.addEventListener("input", handleInput);

					return () => {
						node.removeEventListener("input", handleInput);
						debouncedEmitStopTyping.cancel();

						// Ensure a final stop signal is sent if component unmounts while typing
						emitStopTyping();
					};
				}
			},
			[debouncedEmitStopTyping, emitStartTyping, emitStopTyping],
		);

	return setTypingRef;
};

export const TextBox = ({ className }: { className?: string }) => {
	const { register } = useFormContext<MessageForm>();

	const setTypingRef = useEmitTypingStatus();

	const { ref: fieldRef, name, onChange, onBlur } = register("content");

	return (
		<MessageTextBox
			ref={(node) => {
				fieldRef(node);
				const typingCleanup = setTypingRef(node);
				return typingCleanup;
			}}
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			onChange={onChange}
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			onBlur={onBlur}
			name={name}
			placeholder="Type a message..."
			className={cn(className)}
		/>
	);
};
