/** @format */

// prettier-ignore
/* eslint-disable testing-library/prefer-screen-queries */

import React from "react";
import { Mock } from "vitest";
import { render, RenderResult } from "vitest-browser-react";
import { LongPressOptions, useLongPress } from "./use-long-press";

const getLongPressBtn = (getByRole: RenderResult["getByRole"]) =>
	getByRole("button").getByText(new RegExp("long press", "i")).element();

const createMousePressHoldEvent = () => {
	return new MouseEvent("mousedown", {
		bubbles: true,
		buttons: 1, // Left mouse button
	});
};

const createMouseReleaseEvent = (
	type: "mouseup" | "mouseleave" = "mouseup",
) => {
	return new MouseEvent(type, {
		bubbles: true,
	});
};

const createTouchPressHoldEvent = (target: Element) => {
	return new TouchEvent("touchstart", {
		bubbles: true,
		touches: [
			new Touch({
				identifier: 0,
				target: target,
				clientX: 0,
				clientY: 0,
			}),
		],
	});
};

const createTouchReleaseEvent = () => {
	return new TouchEvent("touchend", {
		bubbles: true,
		touches: [], // No touches remaining on end
	});
};

let mockCallback: Mock;
let mockOnFinish: Mock;
let mockOnCancel: Mock;
let mockOnStart: Mock;
const LONG_PRESS_THRESHOLD = 400;

interface LongPressButtonProps extends LongPressOptions {
	callback: (e: React.SyntheticEvent) => void;
}
const LongPressButton = ({ callback, ...options }: LongPressButtonProps) => {
	const handlers = useLongPress(callback, options);

	return (
		<button type="button" {...handlers}>
			Long Press Me
		</button>
	);
};

const renderLongPressBtn = (props?: LongPressButtonProps) => {
	return render(
		<LongPressButton
			callback={mockCallback}
			onFinish={mockOnFinish}
			onCancel={mockOnCancel}
			onStart={mockOnStart}
			threshold={LONG_PRESS_THRESHOLD}
			{...props}
		/>,
	);
};

vi.useFakeTimers();

beforeEach(() => {
	mockCallback = vi.fn();
	mockOnFinish = vi.fn();
	mockOnCancel = vi.fn();
	mockOnStart = vi.fn();
	vi.clearAllMocks();
});

describe("successful long press", () => {
	it("should call onStart, callback, and onFinish using a mouse", async () => {
		const { getByRole } = await renderLongPressBtn();

		const button = getLongPressBtn(getByRole);

		// Simulate Press-Down
		button.dispatchEvent(createMousePressHoldEvent());

		expect(mockOnStart).toHaveBeenCalledTimes(1);
		expect(mockCallback).not.toHaveBeenCalled();
		expect(mockOnFinish).not.toHaveBeenCalled();

		vi.advanceTimersByTime(LONG_PRESS_THRESHOLD);

		expect(mockCallback).toHaveBeenCalledTimes(1);

		// Simulate Mouse Release
		button.dispatchEvent(createMouseReleaseEvent());

		expect(mockOnFinish).toHaveBeenCalledTimes(1);
		expect(mockOnCancel).not.toHaveBeenCalled();
	});

	it("should call onStart, callback, and onFinish using a touch pointer", async () => {
		const { getByRole } = await renderLongPressBtn();

		const button = getLongPressBtn(getByRole);

		// Simulate Press-Down (TouchStart)
		// A valid TouchEvent needs a 'touches' list
		button.dispatchEvent(createTouchPressHoldEvent(button));

		expect(mockOnStart).toHaveBeenCalledTimes(1);
		expect(mockCallback).not.toHaveBeenCalled();
		expect(mockOnFinish).not.toHaveBeenCalled();

		vi.advanceTimersByTime(LONG_PRESS_THRESHOLD);

		expect(mockCallback).toHaveBeenCalledTimes(1);

		// Simulate Touch Release
		button.dispatchEvent(createTouchReleaseEvent());

		expect(mockOnFinish).toHaveBeenCalledTimes(1);
		expect(mockOnCancel).not.toHaveBeenCalled();
	});
});

describe("short press (unsucessful long press)", () => {
	const SHORT_PRESS_TIME = LONG_PRESS_THRESHOLD / 2;

	it("should call onStart and onCancel but NOT callback and onFinish for a short mouse press", async () => {
		const { getByRole } = await renderLongPressBtn();

		const button = getLongPressBtn(getByRole);

		// Simulate Press-Down (MouseDown)
		button.dispatchEvent(createMousePressHoldEvent());

		expect(mockOnStart).toHaveBeenCalledTimes(1);
		expect(mockCallback).not.toHaveBeenCalled();
		expect(mockOnFinish).not.toHaveBeenCalled();

		vi.advanceTimersByTime(SHORT_PRESS_TIME);

		expect(mockCallback).not.toHaveBeenCalled();

		button.dispatchEvent(createMouseReleaseEvent());

		expect(mockOnCancel).toHaveBeenCalledTimes(1);
		expect(mockOnFinish).not.toHaveBeenCalled();
		expect(mockCallback).not.toHaveBeenCalled();

		// Advance Remaining Time (Verify timer was cleared)
		vi.advanceTimersByTime(LONG_PRESS_THRESHOLD);
		expect(mockCallback).not.toHaveBeenCalled();
	});

	it("should call onStart and onCancel but NOT callback and onFinish for a short touch press", async () => {
		const { getByRole } = await renderLongPressBtn();

		const button = getLongPressBtn(getByRole);

		// Simulate Press-Down (TouchStart)
		button.dispatchEvent(createTouchPressHoldEvent(button));

		expect(mockOnStart).toHaveBeenCalledTimes(1);
		expect(mockCallback).not.toHaveBeenCalled();
		expect(mockOnFinish).not.toHaveBeenCalled();

		vi.advanceTimersByTime(SHORT_PRESS_TIME);

		expect(mockCallback).not.toHaveBeenCalled();

		// Simulate Release (TouchEnd / Cancel)
		button.dispatchEvent(createTouchReleaseEvent());

		expect(mockOnCancel).toHaveBeenCalledTimes(1);
		expect(mockOnFinish).not.toHaveBeenCalled();
		expect(mockCallback).not.toHaveBeenCalled();

		// Advance Remaining Time (Verify timer was cleared)
		vi.advanceTimersByTime(LONG_PRESS_THRESHOLD);
		expect(mockCallback).not.toHaveBeenCalled();
	});
});
