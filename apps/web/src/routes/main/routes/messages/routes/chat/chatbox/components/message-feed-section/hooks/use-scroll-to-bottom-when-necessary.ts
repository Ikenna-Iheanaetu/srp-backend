/** @format */

import React from "react";
import { ScrollToIndexOpts, VListHandle } from "virtua";
import { ChatMessage } from "../../../../types";
import { getItemReversedIndex } from "../../../../utils";

export const useScrollWhenNecessary = (
	messages: ChatMessage[],
): React.RefCallback<VListHandle> => {
	const initialScrollRef = useScrollToBottomOnMount(messages);
	const newMsgScrollRef = useScrollToNewMsg(messages);

	return React.useCallback(
		(node) => {
			const cleanups: ReturnType<React.RefCallback<VListHandle>>[] = [
				initialScrollRef(node),
				newMsgScrollRef(node),
			];

			return () => {
				cleanups.forEach((cleanup) => {
					cleanup?.();
				});
			};
		},
		[initialScrollRef, newMsgScrollRef],
	);
};

const SCROLL_CONFIG: ScrollToIndexOpts = {
	align: "start", // required to scroll to the bottom of the specific message
};

const useScrollToBottomOnMount = (
	messages: ChatMessage[],
): React.RefCallback<VListHandle> => {
	const isInitialRenderRef = React.useRef(true);
	const initialScrollRef: React.RefCallback<VListHandle> = React.useCallback(
		(node) => {
			if (!isInitialRenderRef.current) {
				return;
			}

			if (node && messages.length > 0) {
				isInitialRenderRef.current = false;
				const newestMsgArrayIndex = 0;
				const lastMsgInRenderIndex = getItemReversedIndex(
					messages.length,
					newestMsgArrayIndex,
				);
				node.scrollToIndex(lastMsgInRenderIndex, {
					...SCROLL_CONFIG,
					smooth: false,
				});
			}
		},
		[messages.length],
	);

	return initialScrollRef;
};

const useScrollToNewMsg = (
	messages: ChatMessage[],
): React.RefCallback<VListHandle> => {
	const scrollRef = React.useRef<VListHandle>(null);
	const prevMessagesLengthRef = React.useRef(messages.length);
	const prevLatestTimestampRef = React.useRef(messages[0]?.timestamp || 0);
	// scroll to newest message on arrival
	React.useEffect(() => {
		const latestMsg = messages[0];
		const currentLatestTimestamp = latestMsg?.timestamp || 0;
		const isNewLatestMsg =
			currentLatestTimestamp > prevLatestTimestampRef.current;
		if (isNewLatestMsg) {
			const autoScrollConfig: ScrollToIndexOpts = {
				...SCROLL_CONFIG,
				smooth: true,
			};
			const newMessageIndexInArray = 0;
			const newMessageIndexInRender = getItemReversedIndex(
				messages.length,
				newMessageIndexInArray,
			);

			const newMessage = messages[0];

			if (scrollRef.current) {
				const distanceFromBottom =
					scrollRef.current.scrollSize -
					(scrollRef.current.scrollOffset +
						scrollRef.current.viewportSize);

				// Scroll if it's the user's own message
				if (newMessage && newMessage.from === "ME") {
					scrollRef.current.scrollToIndex(
						newMessageIndexInRender,
						autoScrollConfig,
					);
				}
				// Or if user is already near the bottom (within 300px)
				else if (distanceFromBottom < 300) {
					scrollRef.current.scrollToIndex(
						newMessageIndexInRender,
						autoScrollConfig,
					);
				}
			}
		}
		prevMessagesLengthRef.current = messages.length;
		prevLatestTimestampRef.current = currentLatestTimestamp;
	}, [messages, scrollRef]);

	return React.useCallback((node) => {
		scrollRef.current = node;
	}, []);
};
