/** @format */

import { useInfiniteScrollTrigger } from "@/hooks/use-inifinite-trigger";
import { getScrollFetchThresholdIndex } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";
import { useChatMessagesQueryConfig } from "../../../../hooks/use-chat-messages-query-config";
import { ChatMessage } from "../../../../types";

// NOTE: There's still a minor jump when older messages are loaded
// I've tried to eliminate this, but ...
export const useControlInifiteScroll = (messages: ChatMessage[]) => {
	const { queryOptions } = useChatMessagesQueryConfig();
	const {
		data: apiPaginatedMessages,
		hasNextPage,
		isFetching,
		fetchNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(queryOptions);
	const totalFetchedApiMsgs: number = (() => {
		let count = 0;
		apiPaginatedMessages?.pages.forEach(({ data }) => {
			count = count + data.length;
		});

		return count;
	})();

	const listElementRef = React.useRef<HTMLElement>(null);
	const prevScrollHeightRef = React.useRef(0);

	const onFetchedOlderMsgs = React.useEffectEvent(() => {
		const listEl = listElementRef.current;
		if (listEl) {
			const newScrollHeight = listEl.scrollHeight;
			const heightShift = newScrollHeight - prevScrollHeightRef.current;

			// Adjust scrollTop to maintain the user's view position
			listEl.scrollTop += heightShift;

			prevScrollHeightRef.current = listEl.scrollHeight;
		}
	});
	const didFetchMoreRef = React.useRef(false);
	React.useLayoutEffect(() => {
		if (!didFetchMoreRef.current) {
			return;
		}

		onFetchedOlderMsgs();
		const timer = setTimeout(() => {}, 0);
		const resetTimer = setTimeout(() => {
			didFetchMoreRef.current = false;
		}, 0);

		return () => {
			clearTimeout(timer);
			clearTimeout(resetTimer);
		};
	}, [messages]);

	const onFetchMore = async () => {
		await fetchNextPage();

		didFetchMoreRef.current = true;
		const listEl = listElementRef.current;
		if (listEl) {
			prevScrollHeightRef.current = listEl.scrollHeight;
		}
	};
	const fetchMoreTriggerRef = useInfiniteScrollTrigger(
		hasNextPage,
		isFetching,
		() => void onFetchMore(),
	);

	const fetchMoreIndex = getScrollFetchThresholdIndex(totalFetchedApiMsgs);

	const listElementId = React.useId();
	const listElControlRef = React.useCallback(() => {
		listElementRef.current = document.getElementById(listElementId);
		const observer = new ResizeObserver(() => {
			if (didFetchMoreRef.current) {
				onFetchedOlderMsgs();
			}
		});

		if (listElementRef.current) {
			observer.observe(listElementRef.current);
		}
		return () => {
			listElementRef.current = null;
			observer.disconnect();
		};
	}, [listElementId]);

	return {
		isFetchingNextPage,
		fetchMoreIndex,
		fetchMoreTriggerRef,
		listElementId,
		listElControlRef,
	};
};
