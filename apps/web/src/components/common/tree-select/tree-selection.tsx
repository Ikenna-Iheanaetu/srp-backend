/** @format */
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { DEFAULT_LABELS } from "./constants";
import { TreeNodeRenderer } from "./tree-node-renderer";
import {
	DefaultTreeSelectionProps,
	Labels,
	MultiItemSelectionState,
	MultiItemTreeSelectionProps,
	MultiPathSelectionState,
	MultiPathTreeSelectionProps,
	SelectionVariant,
	TreeSelectionProps,
} from "./types";
import { useTreeSelection } from "./use-tree-selection";

const TreeSelection_: React.FC<TreeSelectionProps> = (props) => {
	const {
		variant = "default",
		data = [],
		labels: customLabels,
		className,
		dropdownMenuProps,
		customTrigger,
	} = props;
	const labels: Labels = { ...DEFAULT_LABELS, ...customLabels };

	const { state, select, checkIsSelected, setControlledState } =
		useTreeSelection(variant);

	// Use a ref to track previous controlled selection to avoid unnecessary updates
	const prevControlledSelectionRef = React.useRef(props.controlledSelection);

	// Track if we're currently handling a selection change
	const isHandlingSelectionRef = React.useRef(false);

	// sync controlled state
	React.useEffect(() => {
		if (isHandlingSelectionRef.current) {
			return;
		}

		// Only skip if we've already processed this exact selection AND it's not the initial load
		const isInitialLoad = prevControlledSelectionRef.current === undefined;
		if (
			!isInitialLoad &&
			JSON.stringify(prevControlledSelectionRef.current) ===
				JSON.stringify(props.controlledSelection)
		) {
			return;
		}

		prevControlledSelectionRef.current = props.controlledSelection;

		if (props.controlledSelection) {
			const variant = props.variant;
			switch (variant) {
				case undefined:
				case "default": {
					const controlledSelection = props.controlledSelection;
					setControlledState({
						variant: "default",
						singlePath: controlledSelection,
					});
					break;
				}
				case "multi-item": {
					const controlledSelection = props.controlledSelection;
					setControlledState({
						variant: "multi-item",
						multiItemParent: controlledSelection.parentPath,
						multiItemSelected: controlledSelection.selectedItems,
					});
					break;
				}
				case "multi-path": {
					const controlledSelection = props.controlledSelection;
					setControlledState({
						variant: "multi-path",
						multiPaths: controlledSelection,
					});
					break;
				}
				default:
					// handle all cases
					variant satisfies never;
			}
		}
	}, [props.controlledSelection, props.variant, setControlledState]);

	// Optimistic update handling
	const handleSelection = React.useCallback(
		(path: string[], effectiveVariant: SelectionVariant) => {
			// Set flag to prevent controlled state update loop
			isHandlingSelectionRef.current = true;

			// Apply selection immediately for optimistic update
			select(path, effectiveVariant);

			if (props.onSelectionChange) {
				// Calculate the expected next state for the callback
				React.startTransition(() => {
					switch (effectiveVariant) {
						case "default": {
							const cb =
								props.onSelectionChange as DefaultTreeSelectionProps["onSelectionChange"];
							cb?.(path); // For default, path is the new selection
							break;
						}
						case "multi-item": {
							const cb =
								props.onSelectionChange as MultiItemTreeSelectionProps["onSelectionChange"];
							const currentMultiItemState =
								state as MultiItemSelectionState;
							const parentPath = path.slice(0, -1);
							const item = path[path.length - 1] ?? "";

							let newSelectedItems: string[];
							if (
								JSON.stringify(
									currentMultiItemState.multiItemParent,
								) !== JSON.stringify(parentPath)
							) {
								// Different parent, reset
								newSelectedItems = [item];
							} else {
								// Same parent, toggle item
								const itemIndex =
									currentMultiItemState.multiItemSelected.indexOf(
										item,
									);
								newSelectedItems =
									itemIndex >= 0
										? currentMultiItemState.multiItemSelected.filter(
												(_, index) =>
													index !== itemIndex,
											)
										: [
												...currentMultiItemState.multiItemSelected,
												item,
											];
							}
							cb?.({
								parentPath,
								selectedItems: newSelectedItems,
							});
							break;
						}
						case "multi-path": {
							const cb =
								props.onSelectionChange as MultiPathTreeSelectionProps["onSelectionChange"];
							const currentMultiPathState =
								state as MultiPathSelectionState;
							const pathIndex =
								currentMultiPathState.multiPaths.findIndex(
									(p) =>
										JSON.stringify(p) ===
										JSON.stringify(path),
								);
							const newPaths =
								pathIndex >= 0
									? currentMultiPathState.multiPaths.filter(
											(_, index) => index !== pathIndex,
										)
									: [
											...currentMultiPathState.multiPaths,
											path,
										];
							cb?.(newPaths);
							break;
						}
					}
				});
			}

			isHandlingSelectionRef.current = false;
		},
		[props.onSelectionChange, select, state],
	);

	const getDisplayText = React.useCallback(() => {
		switch (state.variant) {
			case "default":
				return state.singlePath.length > 0
					? state.singlePath[state.singlePath.length - 1]
					: labels.placeholder;

			case "multi-item":
				if (state.multiItemSelected.length === 0)
					return labels.placeholder;
				if (state.multiItemSelected.length === 1)
					return state.multiItemSelected[0];
				return `${state.multiItemSelected.length} items selected`;

			case "multi-path":
				if (state.multiPaths.length === 0) return labels.placeholder;
				if (state.multiPaths.length === 1) {
					const path = state.multiPaths[0] ?? [];
					return path[path.length - 1];
				}
				return `${state.multiPaths.length} paths selected`;
		}
	}, [labels.placeholder, state]);

	const memoisedNodeRenderer = React.useMemo(
		() => (
			<TreeNodeRenderer
				nodes={data}
				currentPath={[]}
				level={0}
				parentVariant={variant}
				checkIsSelected={checkIsSelected}
				handleSelection={handleSelection}
			/>
		),
		[data, variant, checkIsSelected, handleSelection],
	);

	return (
		<DropdownMenu {...dropdownMenuProps}>
			<DropdownMenuTrigger asChild>
				{customTrigger ?? (
					<Button
						variant="outline"
						className={cn("w-full justify-between", className)}>
						<span className="truncate">{getDisplayText()}</span>
						<ChevronDown className="h-4 w-4 shrink-0" />
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-80 tw-scrollbar" align="start">
				{memoisedNodeRenderer}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export const TreeSelection = React.memo(
	TreeSelection_,
) as typeof TreeSelection_;
TreeSelection.displayName = "TreeSelection";
