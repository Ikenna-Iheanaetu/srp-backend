/** @format */

import dayjs from "dayjs";
import React from "react";

/**
 * Hook to calculate remaining hours until cooldown expires
 * Updates every minute to show live countdown
 *
 */
export const useCooldownCountdown = (canRetryAt: string | undefined) => {
	const calculateRemainingHours = React.useCallback(
		(canRetryAt: string | undefined): number => {
			if (!canRetryAt) {
				return 0;
			}
			const now = dayjs();
			const retryTime = dayjs(canRetryAt);
			const hours = Math.ceil(retryTime.diff(now, "hour", true));
			return Math.max(0, hours);
		},
		[],
	);

	const [remainingHours, setRemainingHours] = React.useState(() =>
		calculateRemainingHours(canRetryAt),
	);

	const timerRef = React.useRef<NodeJS.Timeout>(null);
	React.useEffect(() => {
		const remainingHours = calculateRemainingHours(canRetryAt);
		if (remainingHours <= 0 && timerRef.current) {
			clearInterval(timerRef.current);
			return;
		}

		timerRef.current = setInterval(() => {
			const hours = calculateRemainingHours(canRetryAt);
			setRemainingHours(hours);
		}, 60000); // Update every minute

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [calculateRemainingHours, canRetryAt]);

	return remainingHours;
};
