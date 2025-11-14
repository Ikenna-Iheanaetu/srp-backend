/** @format */

import debounce from "lodash.debounce";
import React from "react";

/**
 * Custom hook that runs a cleanup function when the component is unmounted. Preferred over plain useEffect because it prevents stale closures.
 */
function useUnmount(func: () => void) {
	const funcRef = React.useRef(func);

	funcRef.current = func;

	React.useEffect(
		() => () => {
			funcRef.current();
		},
		[],
	);
}

/** Configuration options for controlling the behavior of the debounced function. */
type DebounceOptions = {
	/**
	 * The maximum time the specified function is allowed to be delayed before it is invoked.
	 */
	maxWait?: number;
} & (
	| {
			/** The function will be invoked on the leading edge (immediately). */
			leading: true;
			/** The function will NOT be invoked on the trailing edge. */
			trailing?: false;
	  }
	| {
			/** The function will be invoked on the trailing edge (after the delay). */
			leading?: false;
			/** The function will be invoked on the trailing edge. */
			trailing: true;
	  }
);

/** Functions to manage a debounced callback. */
type ControlFunctions = {
	/** Cancels pending function invocations. */
	cancel: () => void;
	/** Immediately invokes pending function invocations. */
	flush: () => void;
	/**
	 * Checks if there are any pending function invocations.
	 * @returns `true` if there are pending invocations, otherwise `false`.
	 */
	isPending: () => boolean;
};

/**
 * Represents the state and control functions of a debounced callback.
 * Subsequent calls to the debounced function return the result of the last invocation.
 * Note: If there are no previous invocations, the result will be undefined.
 * Ensure proper handling in your code.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DebouncedState<T extends (...args: any[]) => ReturnType<T>> = ((
	...args: Parameters<T>
) => ReturnType<T> | undefined) &
	ControlFunctions;

/**
 * Custom hook that creates a debounced version of a callback function.
 * @see [Documentation](https://usehooks-ts.com/react-hook/use-debounce-callback)
 * @example
 * ```tsx
 * const debouncedCallback = useDebounceCallback(
 *   (searchTerm) => {
 *     // Perform search after user stops typing for 500 milliseconds
 *     searchApi(searchTerm);
 *   },
 *   500
 * );
 *
 * // Later in the component
 * debouncedCallback('react hooks'); // Will invoke the callback after 500 milliseconds of inactivity.
 * ```
 */
export function useDebounceCallback<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends (...args: any[]) => ReturnType<T>,
>(func: T, delay = 500, options?: DebounceOptions): DebouncedState<T> {
	const debouncedFunc = React.useRef<ReturnType<typeof debounce>>(null);

	useUnmount(() => {
		if (debouncedFunc.current) {
			debouncedFunc.current.cancel();
		}
	});

	const debounced = React.useMemo(() => {
		const debouncedFuncInstance = debounce(func, delay, options);

		const wrappedFunc: DebouncedState<T> = (...args: Parameters<T>) => {
			return debouncedFuncInstance(...args);
		};

		wrappedFunc.cancel = () => {
			debouncedFuncInstance.cancel();
		};

		wrappedFunc.isPending = () => {
			return !!debouncedFunc.current;
		};

		wrappedFunc.flush = () => {
			return debouncedFuncInstance.flush();
		};

		return wrappedFunc;
	}, [func, delay, options]);

	// Update the debounced function ref whenever func, wait, or options change
	React.useEffect(() => {
		debouncedFunc.current = debounce(func, delay, options);
	}, [func, delay, options]);

	return debounced;
}

/**
 * Hook options.
 * @template T - The type of the value.
 */
type UseDebounceValueOptions<T> = DebounceOptions & {
	/** A function to determine if the value has changed. Defaults to a function that checks if the value is strictly equal to the previous value. */
	equalityFn?: (left: T, right: T) => boolean;
};

/**
 * Custom hook that returns a debounced version of the provided value, along with a function to update it.
 * @see [Documentation](https://usehooks-ts.com/react-hook/use-debounce-value)
 * @example
 * ```tsx
 * const [debouncedValue, updateDebouncedValue] = useDebounceValue(inputValue, 500, { leading: true });
 * ```
 */
export function useDebounceValue<T>(
	initialValue: T | (() => T),
	delay: number,
	options?: UseDebounceValueOptions<T>,
): [T, DebouncedState<(value: T) => void>] {
	const eq = options?.equalityFn ?? ((left: T, right: T) => left === right);
	const unwrappedInitialValue =
		initialValue instanceof Function ? initialValue() : initialValue;
	const [debouncedValue, setDebouncedValue] = React.useState<T>(
		unwrappedInitialValue,
	);
	const previousValueRef = React.useRef<T | undefined>(unwrappedInitialValue);

	const updateDebouncedValue = useDebounceCallback(
		setDebouncedValue,
		delay,
		options,
	);

	// Update the debounced value if the initial value changes
	if (!eq(previousValueRef.current as T, unwrappedInitialValue)) {
		updateDebouncedValue(unwrappedInitialValue);
		previousValueRef.current = unwrappedInitialValue;
	}

	return [debouncedValue, updateDebouncedValue];
}
