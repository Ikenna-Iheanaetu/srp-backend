/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { chatSocket } from "@/routes/main/routes/messages/chat-socket-manager";
import {
	MessageFeed,
	MessageTypingIndicator,
} from "@/routes/main/routes/messages/components/chat/message-feed";
import React from "react";
import { useChatRoom } from "../../../chat-room-context";
import { useChatMessages } from "../../../hooks/use-chat-messages";
import { getMessageDateGroup, renderMessagesReversed } from "../../../utils";
import { MessageItemContainer } from "./components/message-item-container";
import { useControlInifiteScroll } from "./hooks/use-control-inifinite-scroll";
import { useScrollWhenNecessary } from "./hooks/use-scroll-to-bottom-when-necessary";

const RecipientTypingFeedback = ({ className }: { className?: string }) => {
	const [isTyping, setIsTyping] = React.useState(false);

	const { roomId } = useChatRoom();

	React.useEffect(() => {
		// Only attach listeners if the room is confirmed ready
		if (!roomId) return;

		const onStartTyping = () => setIsTyping(true);
		const onStopTyping = () => setIsTyping(false);

		chatSocket.on("typing:start", onStartTyping);
		chatSocket.on("typing:stop", onStopTyping);

		return () => {
			chatSocket.off("typing:start", onStartTyping);
			chatSocket.off("typing:stop", onStopTyping);
		};
	}, [roomId]);

	return (
		<div className={cn("h-8", className)}>
			<MessageTypingIndicator isTyping={isTyping} />
		</div>
	);
};

const DateGroupBadge = ({
	className,
	...props
}: React.ComponentProps<typeof Badge>) => (
	<Badge
		variant={"outline"}
		{...props}
		className={cn(
			"h-6 whitespace-nowrap rounded-full border-slate-200 px-2 text-xs text-blue-500",
			className,
		)}
	/>
);

export const MessageFeedSection: React.FC<{ className?: string }> = ({
	className,
}) => {
	const { messages } = useChatMessages();

	const {
		isFetchingNextPage,
		fetchMoreIndex,
		fetchMoreTriggerRef,
		listElementId,
		listElControlRef,
	} = useControlInifiteScroll(messages);

	const scrollRef = useScrollWhenNecessary(messages);

	return (
		<MessageFeed
			id={listElementId}
			ref={(handle) => {
				const scrollCleanup = scrollRef(handle);
				const controlCleanup = listElControlRef();
				return () => {
					scrollCleanup?.();
					controlCleanup();
				};
			}}
			className={cn("", className)}>
			<div className="flex h-5 items-center justify-center p-1">
				{isFetchingNextPage && <LoadingIndicator />}
			</div>

			{(() => {
				let lastRenderedDateGroup: string | null = null;
				return renderMessagesReversed(
					messages,
					({ message, isLastInBlock, reversedIndex }) => {
						const currentDateGroup = getMessageDateGroup(
							message.timestamp,
						);

						const shouldRenderSeparator =
							currentDateGroup !== lastRenderedDateGroup;

						lastRenderedDateGroup = currentDateGroup;

						return (
							<React.Fragment>
								{shouldRenderSeparator && (
									<DateGroupBadge className="mx-auto my-4 flex w-fit">
										{currentDateGroup}
									</DateGroupBadge>
								)}

								<MessageItemContainer
									ref={
										reversedIndex === fetchMoreIndex
											? fetchMoreTriggerRef
											: undefined
									}
									message={message}
									isLastInBlock={isLastInBlock}
								/>
							</React.Fragment>
						);
					},
				);
			})()}

			<RecipientTypingFeedback />
		</MessageFeed>
	);
};
