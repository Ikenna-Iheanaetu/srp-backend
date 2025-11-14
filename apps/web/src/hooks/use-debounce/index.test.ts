/** @format */

import { act, renderHook } from "@testing-library/react";
import { useDebounceCallback, useDebounceValue } from ".";

describe("useDebounceCallback()", () => {
	vitest.useFakeTimers();

	it("should debounce the callback", () => {
		const delay = 500;
		const debouncedCallback = vitest.fn();
		const { result } = renderHook(() =>
			useDebounceCallback(debouncedCallback, delay),
		);

		act(() => {
			result.current("argument");
		});

		// The callback should not be invoked immediately
		expect(debouncedCallback).not.toHaveBeenCalled();

		// Fast forward time by 500 milliseconds
		vitest.advanceTimersByTime(delay);

		// The callback should be invoked after the debounce interval
		expect(debouncedCallback).toHaveBeenCalledTimes(1);
	});

	it("should handle options", () => {
		const delay = 500;
		const debouncedCallback = vitest.fn();
		const { result } = renderHook(() =>
			useDebounceCallback(debouncedCallback, delay, { leading: true }),
		);

		act(() => {
			result.current("argument");
		});

		// The callback should be invoked immediately due to leading option
		expect(debouncedCallback).toHaveBeenCalledWith("argument");

		// Fast forward time by 500 milliseconds
		vitest.advanceTimersByTime(delay);

		// The callback should not be invoked again after the interval
		expect(debouncedCallback).toHaveBeenCalledTimes(1);
	});

	it("should debounce the callback function", () => {
		const callback = vitest.fn();
		const { result } = renderHook(() => useDebounceCallback(callback, 100));

		act(() => {
			result.current("test1");
			result.current("test2");
			result.current("test3");
		});

		expect(callback).not.toBeCalled();

		// Fast forward time
		vitest.advanceTimersByTime(200);

		expect(callback).toBeCalledTimes(1);
		expect(callback).toBeCalledWith("test3");
	});

	it("should cancel the debounced callback", () => {
		const delay = 500;
		const debouncedCallback = vitest.fn();
		const { result } = renderHook(() =>
			useDebounceCallback(debouncedCallback, delay),
		);

		act(() => {
			result.current("argument");
			result.current.cancel();
		});

		// Fast forward time
		vitest.advanceTimersByTime(200);

		// The callback should not be invoked after cancellation
		expect(debouncedCallback).not.toHaveBeenCalled();
	});

	it("should flush the debounced callback", () => {
		const delay = 500;
		const debouncedCallback = vitest.fn();
		const { result } = renderHook(() =>
			useDebounceCallback(debouncedCallback, delay),
		);

		act(() => {
			result.current("argument");
		});

		// The callback should not be invoked immediately
		expect(debouncedCallback).not.toHaveBeenCalled();

		// Flush the debounced callback
		act(() => {
			result.current.flush();
		});

		// The callback should be invoked immediately after flushing
		expect(debouncedCallback).toHaveBeenCalled();
	});
});

describe("useDebounceValue()", () => {
	vitest.useFakeTimers();

	it("should debounce the value update", () => {
		const { result } = renderHook(() => useDebounceValue("initial", 100));

		expect(result.current[0]).toBe("initial");

		act(() => {
			result.current[1]("update1");
			result.current[1]("update2");
			result.current[1]("update3");
		});

		expect(result.current[0]).toBe("initial");

		// Advance timers by more than delay
		act(() => {
			vitest.advanceTimersByTime(200);
		});

		expect(result.current[0]).toBe("update3");

		// Advance timers by more than delay again
		act(() => {
			vitest.advanceTimersByTime(200);
		});

		expect(result.current[0]).toBe("update3");
	});

	it("should handle options", () => {
		const delay = 500;
		const { result } = renderHook(() =>
			useDebounceValue("initial", delay, { leading: true }),
		);

		expect(result.current[0]).toBe("initial");

		act(() => {
			result.current[1]("updated");
		});

		// The debounced value should be updated immediately due to leading option
		expect(result.current[0]).toBe("updated");

		// Wait for the debounce interval to elapse
		vitest.advanceTimersByTime(delay);

		// The debounced value should not be updated again after the interval
		expect(result.current[0]).toBe("updated");
	});
});
