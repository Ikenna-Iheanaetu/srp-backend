/** @format */

import React from "react";

export interface LongPressOptions {
	/**
	 * Minimum time (ms) to hold down to trigger long press.
	 * @default 400
	 */
	threshold?: number;
	/**
	 * Called on mouse down or touch start.
	 */
	onStart?: (e: React.SyntheticEvent) => void;
	/**
	 * Called on release/exit if the threshold was met (long press successful).
	 */
	onFinish?: (e: React.SyntheticEvent) => void;
	/**
	 * Called on release/exit if the threshold was NOT met (long press unsuccessful).
	 */
	onCancel?: (e: React.SyntheticEvent) => void;
}

interface LongPressFns {
	onMouseDown: (e: React.MouseEvent) => void;
	onMouseUp: (e: React.MouseEvent) => void;
	onMouseLeave: (e: React.MouseEvent) => void;
	onTouchStart: (e: React.TouchEvent) => void;
	onTouchEnd: (e: React.TouchEvent) => void;
}

function isMouseEvent(event: React.SyntheticEvent) {
	return "nativeEvent" in event && event.nativeEvent instanceof MouseEvent;
}

function isTouchEvent({ nativeEvent }: React.SyntheticEvent) {
	return window.TouchEvent
		? nativeEvent instanceof TouchEvent
		: "touches" in nativeEvent;
}

/**
 * Hook to execute a function when an element is held down for a specified duration.
 *
 * @param callback Called when the long press time (threshold) is met.
 * @param options Configuration for the long press behavior.
 */
export function useLongPress(
	/**Called when the long press time (threshold) is met. */
	callback: (e: React.SyntheticEvent) => void,
	options: LongPressOptions = {},
): LongPressFns {
	const { threshold = 400, onStart, onFinish, onCancel } = options;
	const isLongPressActive = React.useRef(false);
	const isPressed = React.useRef(false);
	const timerId = React.useRef<NodeJS.Timeout>(null);

	const events = React.useMemo(() => {
		const start = (event: React.SyntheticEvent) => {
			if (!isMouseEvent(event) && !isTouchEvent(event)) return;

			if (onStart) {
				onStart(event);
			}

			isPressed.current = true;
			timerId.current = setTimeout(() => {
				callback(event);
				isLongPressActive.current = true;
			}, threshold);
		};

		const release = (event: React.SyntheticEvent) => {
			if (!isMouseEvent(event) && !isTouchEvent(event)) return;

			if (isLongPressActive.current) {
				if (onFinish) {
					onFinish(event);
				}
			} else if (isPressed.current) {
				if (onCancel) {
					onCancel(event);
				}
			}

			isLongPressActive.current = false;
			isPressed.current = false;

			if (timerId.current) {
				window.clearTimeout(timerId.current);
			}
		};

		const mouseHandlers = {
			onMouseDown: start,
			onMouseUp: release,
			onMouseLeave: release,
		};

		const touchHandlers = {
			onTouchStart: start,
			onTouchEnd: release,
		};

		return {
			...mouseHandlers,
			...touchHandlers,
		};
	}, [callback, threshold, onCancel, onFinish, onStart]);

	return events;
}
