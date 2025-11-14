/** @format */

import { useDebounceCallback } from "@/hooks/use-debounce";
import React from "react";

interface UseResponsiveStateProps<T> {
	value: T;
	onValueChange: (value: T) => void;
}

/**
 * A custom hook that manages an optimistic local state synchronized with an external value, and provides a debounced handler for updating the external
 * value.
 *
 * **NOTE**: For this abstraction to work, you must isolate the element using this state to its own component, so that the state from this hook becomes the only internally implemented state inside it.
 *
 * @returns A tuple containing:
 *   - `optimisticValue`: The current local (optimistic) value.
 *   - `handleValueChange`: A function to update the value locally and trigger the debounced external update.
 */
export function useResponsiveState<T>({
	value: externalValue,
	onValueChange,
}: UseResponsiveStateProps<T>): [
	optimisticValue: T,
	handleValueChange: (value: T) => void,
] {
	const [optimisticValue, setOptimisticValue] = React.useState(externalValue);

	React.useEffect(() => {
		// TODO: track leading state updates so outdated external update doesn't reset a more recent local state
		setOptimisticValue(externalValue);
	}, [externalValue]);

	const debouncedUpdate = useDebounceCallback(onValueChange);

	const handleValueChange = React.useCallback(
		(value: T) => {
			setOptimisticValue(value); // Immediate local update
			debouncedUpdate(value); // Debounced external update
		},
		[debouncedUpdate],
	);

	return [optimisticValue, handleValueChange];
}
