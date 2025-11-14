/** @format */

// prettier-ignore
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/// <reference types="vitest/globals" />

import "@testing-library/jest-dom/vitest";

// Register Zod prototype custom methods from './types/zod.ts' to be ready before any tests.
import "./src/types/zod";

/**
 * @description Mocks common browser APIs that are not available in JSDOM.
 * This is necessary to prevent `ReferenceError`s when testing UI components,
 * such as those from the `cmdk` library, that rely on these APIs for their functionality.
 */
const setupJSDOMMocks = () => {
	global.ResizeObserver = class ResizeObserver {
		constructor(cb: any) {
			(this as any).cb = cb;
		}

		observe() {
			(this as any).cb([
				{ borderBoxSize: { inlineSize: 0, blockSize: 0 } },
			]);
		}

		unobserve() {}

		disconnect() {} // the mock
	};

	(global as any).IntersectionObserver = class IntersectionObserver {
		observe = vi.fn();
		unobserve = vi.fn();
		disconnect = vi.fn();
	};

	(global as any).DOMRect = {
		fromRect: () =>
			({
				top: 0,
				left: 0,
				bottom: 0,
				right: 0,
				width: 0,
				height: 0,
			}) as any,
	};

	function createMockPointerEvent(
		type: string,
		props: PointerEventInit = {},
	): PointerEvent {
		const event = new Event(type, props) as PointerEvent;
		Object.assign(event, {
			button: props.button ?? 0,
			ctrlKey: props.ctrlKey ?? false,
			pointerType: props.pointerType ?? "mouse",
		});
		return event;
	}

	window.PointerEvent = createMockPointerEvent as any;

	// Mock HTMLElement methods
	Object.assign(window.HTMLElement.prototype, {
		scrollIntoView: vi.fn(),
		releasePointerCapture: vi.fn(),
		hasPointerCapture: vi.fn(),
	});
};

setupJSDOMMocks();
