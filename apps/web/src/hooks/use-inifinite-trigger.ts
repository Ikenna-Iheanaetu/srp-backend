/** @format */

import React from "react";

/**
 * A custom hook to observe an element and trigger data fetching
 * for infinite scrolling when the element becomes visible.
 */
export const useInfiniteScrollTrigger = (
	hasNextPage: boolean,
	isFetching: boolean,
	onFetchNextPage: () => void,
): React.RefCallback<Element> => {
	const triggerRef: React.RefCallback<Element> = React.useCallback(
		(node) => {
			if (!node) {
				return;
			}

			const observer = new IntersectionObserver(
				(entries) => {
					const [entry] = entries;

					if (entry?.isIntersecting && hasNextPage && !isFetching) {
						onFetchNextPage();
					}
				},

				{ threshold: 0.1 },
			);

			observer.observe(node);

			return () => {
				observer.disconnect();
			};
		},
		[hasNextPage, isFetching, onFetchNextPage],
	);

	return triggerRef;
};
