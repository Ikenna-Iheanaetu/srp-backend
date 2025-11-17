/** @format */

import React from "react";

const useThrottle = <T>(value: T, interval = 500): T => {
	const [throttledValue, setThrottledValue] = React.useState(value);
	const lastUpdatedRef = React.useRef<number>(null);

	React.useEffect(() => {
		const now = Date.now();

		if (
			lastUpdatedRef.current &&
			now >= lastUpdatedRef.current + interval
		) {
			lastUpdatedRef.current = now;
			setThrottledValue(value);
		} else {
			const id = window.setTimeout(() => {
				lastUpdatedRef.current = now;
				setThrottledValue(value);
			}, interval);

			return () => window.clearTimeout(id);
		}
	}, [value, interval]);

	return throttledValue;
};

const useMinimumLoadingDelay = (loading: boolean, minDelay = 400): boolean =>
	useThrottle(loading, loading ? minDelay : 0);

export { useThrottle, useMinimumLoadingDelay };
