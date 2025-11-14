/** @format */

"use client";

import { TREE_PATH_SEPERATOR } from "@/constants/tree-ui";
import { AutocompleteString } from "@/types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { TreeSelection } from "../tree-select";
import { MultiItemSelection, MultiItemTreeNode } from "../tree-select/types";
import { TriggerButton, type TriggerButtonLabels } from "./trigger-button";

export interface TreeFiltersDropdownData<Key extends string = string> {
	labels: TriggerButtonLabels<Key> & {
		menu: string;
	};
	options: MultiItemTreeNode[];
}

type Option =
	AutocompleteString<`${string}${typeof TREE_PATH_SEPERATOR}${string}`>;

interface Props<Key extends string, TOption extends Option> {
	filterValues: TreeFiltersDropdownData<Key>;
	onOptionToggle?: (toggledOption: TOption) => void;
	selectedOptions?: TOption[];
	className?: string;
}

export const TreeFilterDropdown = <
	TKey extends string,
	TOption extends Option,
>({
	filterValues,
	className,
	onOptionToggle,
	selectedOptions = [],
}: Props<TKey, TOption>) => {
	// Track the last toggled option to avoid duplicate updates
	const lastToggledOptionRef = useRef<TOption | null>(null);

	// Track if we're handling an internal update
	const isInternalUpdateRef = useRef(false);

	// Convert selectedOptions back to TreeSelection format for controlled state
	const controlledSelection: MultiItemSelection = useMemo(() => {
		if (!selectedOptions || selectedOptions.length === 0) {
			return { parentPath: [], selectedItems: [] };
		}

		// Group selected options by parent path to find the most common parent

		const parentPathMap = new Map<string, MultiItemSelection>();

		for (const option of selectedOptions) {
			const pathParts = option.split(TREE_PATH_SEPERATOR);

			const ITEM_POSITION = -1;
			const item = pathParts.at(ITEM_POSITION) ?? "";
			const parentPath = pathParts.slice(0, ITEM_POSITION);
			const parentPathKey = JSON.stringify(parentPath);

			if (!parentPathMap.has(parentPathKey)) {
				parentPathMap.set(parentPathKey, {
					parentPath,
					selectedItems: [],
				});
			}

			parentPathMap.get(parentPathKey)?.selectedItems.push(item);
		}

		// Find the parent path with the most items
		let bestParentPath: MultiItemSelection["parentPath"] = [];
		let bestItems: MultiItemSelection["selectedItems"] = [];

		for (const { parentPath, selectedItems } of parentPathMap.values()) {
			if (selectedItems.length > bestItems.length) {
				bestParentPath = parentPath;
				bestItems = selectedItems;
			}
		}

		return { parentPath: bestParentPath, selectedItems: bestItems };
	}, [selectedOptions]);

	// Track the previous selection to accurately detect changes
	const prevSelectionRef = useRef<MultiItemSelection>({
		parentPath: [],
		selectedItems: [],
	});

	useEffect(() => {
		if (!isInternalUpdateRef.current) {
			prevSelectionRef.current = controlledSelection;
			lastToggledOptionRef.current = null;
		}
	}, [controlledSelection]);

	// Handle selection changes from TreeSelection with optimistic updates
	const handleSelectionChange = useCallback(
		(selection: MultiItemSelection) => {
			if (!onOptionToggle) return;

			// Skip if we're already handling an update
			if (isInternalUpdateRef.current) {
				return;
			}

			const prevSelection = prevSelectionRef.current;

			// Case 1: Parent path changed - we need to find what was selected in the new path
			if (
				JSON.stringify(prevSelection.parentPath) !==
				JSON.stringify(selection.parentPath)
			) {
				if (selection.selectedItems.length > 0) {
					// When parent path changes, we always have exactly one item selected
					const newItem = selection.selectedItems[0];
					const toggledOption = [
						...selection.parentPath,
						newItem,
					].join(TREE_PATH_SEPERATOR) as TOption;

					// Skip if this is the same as the last toggled option
					if (toggledOption !== lastToggledOptionRef.current) {
						lastToggledOptionRef.current = toggledOption;
						onOptionToggle(toggledOption);
					}
				}

				isInternalUpdateRef.current = false;
				return;
			}

			// Case 2: Same parent path, but items changed - find the difference
			const prevItems = new Set(prevSelection.selectedItems);
			const newItems = new Set(selection.selectedItems);

			// Find added item
			for (const item of newItems) {
				if (!prevItems.has(item)) {
					const toggledOption = [...selection.parentPath, item].join(
						TREE_PATH_SEPERATOR
					) as TOption;

					// Skip if this is the same as the last toggled option
					if (toggledOption !== lastToggledOptionRef.current) {
						lastToggledOptionRef.current = toggledOption;
						onOptionToggle(toggledOption);
					}

					isInternalUpdateRef.current = false;
					return;
				}
			}

			// Find removed item
			for (const item of prevItems) {
				if (!newItems.has(item)) {
					const toggledOption = [...selection.parentPath, item].join(
						TREE_PATH_SEPERATOR
					) as TOption;

					// Skip if this is the same as the last toggled option
					if (toggledOption !== lastToggledOptionRef.current) {
						lastToggledOptionRef.current = toggledOption;
						onOptionToggle(toggledOption);
					}

					isInternalUpdateRef.current = false;
					return;
				}
			}

			// Reset the internal update flag if no changes were detected
			isInternalUpdateRef.current = false;
		},
		[onOptionToggle]
	);

	// Reset the last toggled option when selectedOptions changes externally
	useEffect(() => {
		if (!isInternalUpdateRef.current) {
			lastToggledOptionRef.current = null;
		}
	}, [selectedOptions]);

	return (
		<TreeSelection
			variant="multi-item"
			data={filterValues.options}
			onSelectionChange={handleSelectionChange}
			controlledSelection={controlledSelection}
			customTrigger={
				<TriggerButton
					labels={filterValues.labels}
					className={className}
				/>
			}
			dropdownMenuProps={{
				modal: false,
			}}
		/>
	);
};
