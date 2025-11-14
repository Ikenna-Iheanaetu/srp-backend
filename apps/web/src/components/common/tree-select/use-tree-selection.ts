/** @format */

import * as React from "react";
import {
	ActionSource,
	MultiItemSelectionState,
	MultiPathSelectionState,
	SelectionAction,
	SelectionState,
	SelectionVariant,
} from "./types";

interface SelectionReducerState {
	state: SelectionState;
	lastUpdateSource?: ActionSource;
	lastUpdateTimestamp: number;
}

function selectionReducer(
	reducerState: SelectionReducerState,
	action: SelectionAction,
): SelectionReducerState {
	// Track the source of the update and timestamp for race condition handling
	const newTimestamp = performance.now();
	const source = action.source;
	/**For debouncing the window for race conditions */
	const WINDOW_DEBOUNCE = 500;

	// For external updates, check if we should ignore this update due to a more recent internal update
	if (
		source === "external" &&
		reducerState.lastUpdateSource === "internal" &&
		newTimestamp - reducerState.lastUpdateTimestamp < WINDOW_DEBOUNCE
	) {
		return reducerState;
	}

	let newState: SelectionState;

	switch (action.type) {
		case "SELECT": {
			const { path, effectiveVariant } = action.payload;

			switch (effectiveVariant) {
				case "default":
					newState = {
						variant: "default",
						singlePath: [...path],
					};
					break;

				case "multi-item": {
					const currentState =
						reducerState.state as MultiItemSelectionState;
					const parentPath = path.slice(0, -1);
					const item = path[path.length - 1] ?? "";

					const currentParentPathStr = JSON.stringify(
						currentState.multiItemParent,
					);
					const newParentPathStr = JSON.stringify(parentPath);
					const isSameParent =
						currentParentPathStr === newParentPathStr;

					if (!isSameParent) {
						newState = {
							variant: "multi-item",
							multiItemParent: [...parentPath],
							multiItemSelected: [item],
						};
					} else {
						const itemIndex =
							currentState.multiItemSelected.indexOf(item);
						const newSelectedItems =
							itemIndex >= 0
								? currentState.multiItemSelected.filter(
										(_, index: number) =>
											index !== itemIndex,
									)
								: [...currentState.multiItemSelected, item];

						newState = {
							variant: "multi-item",
							multiItemParent: currentState.multiItemParent,
							multiItemSelected: newSelectedItems,
						};
					}
					break;
				}

				case "multi-path": {
					const currentState =
						reducerState.state as MultiPathSelectionState;
					const pathIndex = currentState.multiPaths.findIndex(
						(p: string[]) =>
							JSON.stringify(p) === JSON.stringify(path),
					);
					const newPaths =
						pathIndex >= 0
							? currentState.multiPaths.filter(
									(_, index: number) => index !== pathIndex,
								)
							: [...currentState.multiPaths, [...path]];

					newState = {
						variant: "multi-path",
						multiPaths: newPaths,
					};
					break;
				}

				default:
					return reducerState;
			}
			break;
		}

		case "CLEAR": {
			const { currentVariant } = action.payload;
			switch (currentVariant) {
				case "default":
					newState = { variant: "default", singlePath: [] };
					break;
				case "multi-item":
					newState = {
						variant: "multi-item",
						multiItemParent: [],
						multiItemSelected: [],
					};
					break;
				case "multi-path":
					newState = { variant: "multi-path", multiPaths: [] };
					break;
				default:
					return reducerState;
			}
			break;
		}

		case "REMOVE_MULTI_ITEM": {
			const { item } = action.payload;
			if (reducerState.state.variant !== "multi-item")
				return reducerState;
			newState = {
				...reducerState.state,
				multiItemSelected: reducerState.state.multiItemSelected.filter(
					(selectedItem) => selectedItem !== item,
				),
			};
			break;
		}

		case "REMOVE_MULTI_PATH": {
			const { path } = action.payload;
			if (reducerState.state.variant !== "multi-path")
				return reducerState;
			newState = {
				...reducerState.state,
				multiPaths: reducerState.state.multiPaths.filter(
					(selectedPath) =>
						JSON.stringify(selectedPath) !== JSON.stringify(path),
				),
			};
			break;
		}

		case "SET_CONTROLLED_STATE": {
			// Only update if the state actually changed
			if (
				JSON.stringify(action.payload) ===
				JSON.stringify(reducerState.state)
			) {
				return reducerState;
			}
			newState = action.payload;
			break;
		}

		default:
			return reducerState;
	}

	// Check if state actually changed to avoid unnecessary updates
	if (JSON.stringify(newState) === JSON.stringify(reducerState.state)) {
		return reducerState;
	}

	return {
		state: newState,
		lastUpdateSource: source,
		lastUpdateTimestamp: newTimestamp,
	};
}

export function useTreeSelection<TInitialVariant extends SelectionVariant>(
	initialVariant: TInitialVariant,
) {
	const initialState = React.useMemo((): SelectionState => {
		switch (initialVariant) {
			case "default":
				return { variant: "default", singlePath: [] };
			case "multi-item":
				return {
					variant: "multi-item",
					multiItemParent: [],
					multiItemSelected: [],
				};
			case "multi-path":
				return { variant: "multi-path", multiPaths: [] };
			default:
				return { variant: "default", singlePath: [] };
		}
	}, [initialVariant]);

	const [{ state, lastUpdateSource }, dispatch] = React.useReducer(
		selectionReducer,
		{
			state: initialState,
			lastUpdateTimestamp: 0,
		},
	);

	// Optimistic update tracking
	const optimisticStateRef = React.useRef<SelectionState | null>(null);

	const select = React.useCallback(
		(path: string[], effectiveVariant: SelectionVariant) => {
			// Optimistic update - store the expected new state
			let optimisticState: SelectionState | null = null;

			switch (effectiveVariant) {
				case "default": {
					if (state.variant !== "default") break;
					optimisticState = {
						variant: "default",
						singlePath: [...path],
					};
					break;
				}
				case "multi-item": {
					if (state.variant !== "multi-item") break;
					const parentPath = path.slice(0, -1);
					const item = path[path.length - 1] ?? "";
					const isSameParent =
						JSON.stringify(state.multiItemParent) ===
						JSON.stringify(parentPath);

					if (!isSameParent) {
						optimisticState = {
							variant: "multi-item",
							multiItemParent: [...parentPath],
							multiItemSelected: [item],
						};
					} else {
						const itemIndex = state.multiItemSelected.indexOf(item);
						const newSelectedItems =
							itemIndex >= 0
								? state.multiItemSelected.filter(
										(_, index) => index !== itemIndex,
									)
								: [...state.multiItemSelected, item];

						optimisticState = {
							variant: "multi-item",
							multiItemParent: [...state.multiItemParent],
							multiItemSelected: newSelectedItems,
						};
					}
					break;
				}
				case "multi-path": {
					if (state.variant !== "multi-path") break;
					const pathIndex = state.multiPaths.findIndex(
						(p) => JSON.stringify(p) === JSON.stringify(path),
					);
					const newPaths =
						pathIndex >= 0
							? state.multiPaths.filter(
									(_, index) => index !== pathIndex,
								)
							: [...state.multiPaths, [...path]];

					optimisticState = {
						variant: "multi-path",
						multiPaths: newPaths,
					};
					break;
				}

				default:
					// handle all cases
					effectiveVariant satisfies never;
			}

			optimisticStateRef.current = optimisticState;

			dispatch({
				type: "SELECT",
				payload: { path, effectiveVariant },
				source: "internal",
			});
		},
		[state],
	);

	const clear = React.useCallback(() => {
		dispatch({
			type: "CLEAR",
			payload: { currentVariant: state.variant },
			source: "internal",
		});
	}, [state.variant]);

	const removeItem = React.useCallback((item: string) => {
		dispatch({
			type: "REMOVE_MULTI_ITEM",
			payload: { item },
			source: "internal",
		});
	}, []);

	const removePath = React.useCallback((path: string[]) => {
		dispatch({
			type: "REMOVE_MULTI_PATH",
			payload: { path },
			source: "internal",
		});
	}, []);

	const setControlledState = React.useCallback(
		(newState: SelectionState) => {
			// Skip if this is the same as our optimistic state
			if (
				optimisticStateRef.current &&
				JSON.stringify(optimisticStateRef.current) ===
					JSON.stringify(newState)
			) {
				optimisticStateRef.current = null;
				return;
			}

			const currentStateStr = JSON.stringify(state);
			const newStateStr = JSON.stringify(newState);

			// Skip if the state hasn't changed
			if (currentStateStr === newStateStr) {
				return;
			}

			optimisticStateRef.current = null;

			dispatch({
				type: "SET_CONTROLLED_STATE",
				payload: newState,
				source: "external",
			});
		},
		[state],
	);

	// Memoize path comparison for better performance
	const pathComparisonCacheRef = React.useRef(new Map<string, boolean>()); // Clear the cache when state changes
	React.useEffect(() => {
		pathComparisonCacheRef.current.clear();
	}, [state]);

	const checkIsSelected = React.useCallback(
		(path: string[], effectiveVariant: SelectionVariant): boolean => {
			// Use optimistic state if available for immediate feedback
			const currentState = optimisticStateRef.current ?? state;

			// Create a cache key for this check
			const cacheKey = `${JSON.stringify(path)}-${effectiveVariant}-${JSON.stringify(currentState)}`;

			// Check if we have a cached result
			if (pathComparisonCacheRef.current.has(cacheKey)) {
				return pathComparisonCacheRef.current.get(cacheKey)!;
			}

			let result = false;

			switch (effectiveVariant) {
				case "default":
					if (currentState.variant !== "default") break;
					result =
						JSON.stringify(currentState.singlePath) ===
						JSON.stringify(path);
					break;

				case "multi-item": {
					if (currentState.variant !== "multi-item") break;
					const item = path[path.length - 1] ?? "";
					const parentPath = path.slice(0, -1);
					result =
						JSON.stringify(currentState.multiItemParent) ===
							JSON.stringify(parentPath) &&
						currentState.multiItemSelected.includes(item);
					break;
				}

				case "multi-path":
					if (currentState.variant !== "multi-path") break;
					result = currentState.multiPaths.some(
						(p) => JSON.stringify(p) === JSON.stringify(path),
					);
					break;

				default:
					// handle all cases
					effectiveVariant satisfies never;
			}

			// Cache the result (limit cache size to prevent memory leaks)
			if (pathComparisonCacheRef.current.size > 1000) {
				pathComparisonCacheRef.current.clear();
			}
			pathComparisonCacheRef.current.set(cacheKey, result);

			return result;
		},
		[state],
	);

	return React.useMemo(
		() => ({
			state,
			select,
			clear,
			removeItem,
			removePath,
			checkIsSelected,
			setControlledState,
			lastUpdateSource,
		}),
		[
			clear,
			checkIsSelected,
			lastUpdateSource,
			removeItem,
			removePath,
			select,
			setControlledState,
			state,
		],
	);
}
