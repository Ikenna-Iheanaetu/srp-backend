/** @format */

import { type parseAsArrayOf, useQueryStates, Values } from "nuqs";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";

export type ArrayParser<T> = ReturnType<typeof parseAsArrayOf<T>>;
export type ArrayParserWithDefault<T> = ReturnType<
	ArrayParser<T>["withDefault"]
>;

export type FilterParsers = Record<string, ArrayParserWithDefault<string>>;

export type InferFilters<T extends FilterParsers> = {
	[K in keyof T]: string[];
};

interface UpdateFilterParams<T extends FilterParsers> {
	filterKey: keyof T;
	option: string;
	mode?: "add" | "remove" | "toggle";
}

interface Props<T extends FilterParsers> {
	parsers: T;
}

export function useFilterByUrlParams<T extends FilterParsers>({
	parsers,
}: Props<T>) {
	const [urlFilters, setUrlFilters] = useQueryStates(parsers);
	type FiltersType = typeof urlFilters;

	const [localFilters, setLocalFilters] = useState<Values<T>>(urlFilters);

	/** Ref to track if the last URL update was initiated internally.
	 *
	 * This helps prevent external URL changes from overriding optimistic local
	 * state.
	 */
	const isInternalUrlUpdateRef = useRef(false);

	useEffect(() => {
		// If the URL update was initiated by our hook, we don't need to sync local state from URL.
		// This prevents overwriting the local state that's already "ahead" of the URL.
		if (isInternalUrlUpdateRef.current) {
			isInternalUrlUpdateRef.current = false;
			return;
		}

		// If the local state differs from the URL state (e.g., external URL change,
		// or initial mount where localFilters was default initialized),
		// sync local state to match the URL.
		// We stringify sorted arrays to ensure order-independent comparison for string arrays.
		const stringifiedLocal = JSON.stringify(
			Object.fromEntries(
				Object.entries(localFilters).map(([k, v]) => [
					k,
					(v as string[]).sort(),
				])
			)
		);
		const stringifiedUrl = JSON.stringify(
			Object.fromEntries(
				Object.entries(urlFilters).map(([k, v]) => [
					k,
					(v as string[]).sort(),
				])
			)
		);

		if (stringifiedLocal !== stringifiedUrl) {
			setLocalFilters(urlFilters);
		}
	}, [urlFilters, localFilters]);

	const updateFilter = useCallback(
		({ filterKey, option, mode = "toggle" }: UpdateFilterParams<T>) => {
			setLocalFilters((prevLocalFilters) => {
				const currentOptions = (prevLocalFilters[filterKey] ||
					[]) as NonNullable<Values<T>[keyof T]>;
				let newOptions: string[];

				switch (mode) {
					case "add":
						newOptions = currentOptions.includes(option)
							? currentOptions
							: [...currentOptions, option];
						break;
					case "remove":
						newOptions = currentOptions.filter(
							(opt) => opt !== option
						);
						break;
					case "toggle":
					default:
						newOptions = currentOptions.includes(option)
							? currentOptions.filter((opt) => opt !== option)
							: [...currentOptions, option];
						break;
				}

				const newState = {
					...prevLocalFilters,
					[filterKey]: newOptions,
				} as FiltersType;

				isInternalUrlUpdateRef.current = true;
				void setUrlFilters({
					[filterKey]: newOptions,
				} as Partial<FiltersType>);

				return newState;
			});
		},
		[setUrlFilters]
	);

	const setMultipleFilters = useCallback(
		(newFilters: Partial<FiltersType>) => {
			setLocalFilters((prevLocalFilters) => {
				const newState = {
					...prevLocalFilters,
					...newFilters,
				} as FiltersType;
				isInternalUrlUpdateRef.current = true;
				void setUrlFilters(newFilters);
				return newState;
			});
		},
		[setUrlFilters]
	);

	const clearFilter = useCallback(
		(filterKey: keyof FiltersType) => {
			setLocalFilters((prevLocalFilters) => {
				const newState = {
					...prevLocalFilters,
					[filterKey]: [],
				} as FiltersType;
				isInternalUrlUpdateRef.current = true;
				void setUrlFilters({ [filterKey]: [] } as Partial<FiltersType>);
				return newState;
			});
		},
		[setUrlFilters]
	);

	const clearAllFilters = useCallback(() => {
		const clearedUrlFilters: Partial<FiltersType> = {};
		for (const key of Object.keys(parsers) as (keyof T)[]) {
			clearedUrlFilters[key] = [] as Partial<FiltersType>[keyof T];
		}

		isInternalUrlUpdateRef.current = true;
		setLocalFilters(clearedUrlFilters as FiltersType);
		void setUrlFilters(clearedUrlFilters);
	}, [parsers, setUrlFilters]);

	return useMemo(
		() => ({
			filters: localFilters,
			updateFilter,
			setMultipleFilters,
			clearFilter,
			clearAllFilters,
		}),
		[
			clearAllFilters,
			clearFilter,
			localFilters,
			setMultipleFilters,
			updateFilter,
		]
	);
}
