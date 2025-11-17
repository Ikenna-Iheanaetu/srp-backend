/** @format */

import { cn } from "@/lib/utils";
import { TreePreview } from "./tree-preview";
import { TreeSelection } from "./tree-selection";
import { TreeStatistics } from "./tree-statistics";
import { TreeSelectionProps } from "./types";
import { useTreeSelection } from "./use-tree-selection";

type TreeSelectProps = TreeSelectionProps & {
	showPreview?: boolean;
	showStatistics?: boolean;
};

function TreeSelect(props: TreeSelectProps) {
	const {
		showPreview,
		showStatistics,
		data = [],
		labels: customLabels,
		className,
	} = props;

	const { state, clear, removeItem, removePath } = useTreeSelection(
		props.variant ?? "default"
	);

	const handleClear = () => {
		clear();

		if (props.onSelectionChange) {
			switch (props.variant) {
				case "default":
					props.onSelectionChange?.([]);
					break;
				case "multi-item":
					props.onSelectionChange?.({
						parentPath: [],
						selectedItems: [],
					});
					break;
				case "multi-path":
					props.onSelectionChange?.([]);
					break;
			}
		}
	};

	const handleRemoveItem = (item: string) => {
		if (props.variant === "multi-item") {
			removeItem(item);
			if (props.onSelectionChange && state.variant === "multi-item") {
				const newItems = state.multiItemSelected.filter(
					(selectedItem) => selectedItem !== item
				);
				props.onSelectionChange?.({
					parentPath: state.multiItemParent,
					selectedItems: newItems,
				});
			}
		}
	};

	const handleRemovePath = (path: string[]) => {
		if (props.variant === "multi-path") {
			removePath(path);
			if (props.onSelectionChange && state.variant === "multi-path") {
				const newPaths = state.multiPaths.filter(
					(selectedPath) =>
						JSON.stringify(selectedPath) !== JSON.stringify(path)
				);
				props.onSelectionChange?.(newPaths);
			}
		}
	};

	return (
		<div className={cn("max-w-4xl space-y-6", className)}>
			<div className="flex flex-col items-center space-y-4">
				<TreeSelection {...props} labels={customLabels} />

				{showPreview && (
					<TreePreview
						selectionState={state}
						labels={customLabels}
						onClear={handleClear}
						onRemoveItem={handleRemoveItem}
						onRemovePath={handleRemovePath}
					/>
				)}
			</div>

			{showStatistics && (
				<TreeStatistics data={data} labels={customLabels} />
			)}
		</div>
	);
}

export {
	TreePreview,
	TreeSelect,
	TreeSelection,
	TreeStatistics,
	useTreeSelection,
};
