/** @format */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { DEFAULT_LABELS } from "./constants";
import { Labels, SelectionState } from "./types";

/** @format */
interface TreePreviewProps {
	selectionState: SelectionState;
	labels?: Partial<Labels>;
	onClear?: () => void;
	onRemoveItem?: (item: string) => void;
	onRemovePath?: (path: string[]) => void;
	className?: string;
}

export function TreePreview({
	selectionState,
	labels: customLabels,
	onClear,
	onRemoveItem,
	onRemovePath,
	className,
}: TreePreviewProps) {
	const labels: Labels = { ...DEFAULT_LABELS, ...customLabels };

	const hasSelection = ((): boolean => {
		switch (selectionState.variant) {
			case "default":
				return selectionState.singlePath.length > 0;
			case "multi-item":
				return selectionState.multiItemSelected.length > 0;
			case "multi-path":
				return selectionState.multiPaths.length > 0;
		}
	})();

	if (!hasSelection) {
		return null;
	}

	return (
		<div
			className={cn("w-80 p-4 bg-muted rounded-lg space-y-3", className)}>
			{selectionState.variant === "default" && (
				<>
					<h3 className="font-semibold text-sm">
						{labels.selectedPath}
					</h3>
					<div className="space-y-2 text-sm">
						{selectionState.singlePath.map((item, index) => (
							<div
								key={index}
								className="flex items-center gap-2">
								<span className="font-medium text-muted-foreground">
									{labels.levelLabel} {index + 1}:
								</span>
								<span>{item}</span>
							</div>
						))}
					</div>
					<div className="text-xs text-muted-foreground pt-1">
						{labels.pathLabel}{" "}
						{selectionState.singlePath.join(" → ")}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={onClear}
						className="w-full">
						{labels.clearButton}
					</Button>
				</>
			)}

			{selectionState.variant === "multi-item" && (
				<>
					<h3 className="font-semibold text-sm">
						{labels.selectedItems}
					</h3>
					<div className="text-xs text-muted-foreground">
						{labels.pathLabel}{" "}
						{selectionState.multiItemParent.join(" → ")}
					</div>
					<div className="flex flex-wrap gap-2">
						{selectionState.multiItemSelected.map((item) => (
							<Badge
								key={item}
								variant="secondary"
								className="text-xs">
								{item}
								<X
									className="h-3 w-3 ml-1 cursor-pointer"
									onClick={() => onRemoveItem?.(item)}
								/>
							</Badge>
						))}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={onClear}
						className="w-full">
						{labels.clearAll}
					</Button>
				</>
			)}

			{selectionState.variant === "multi-path" && (
				<>
					<h3 className="font-semibold text-sm">
						{labels.selectedPaths}
					</h3>
					<div className="space-y-2 max-h-40 overflow-y-auto">
						{selectionState.multiPaths.map((path, index) => (
							<div
								key={index}
								className="flex items-center justify-between text-sm bg-background p-2 rounded">
								<span className="truncate">
									{path.join(" → ")}
								</span>
								<X
									className="h-3 w-3 cursor-pointer shrink-0 ml-2"
									onClick={() => onRemovePath?.(path)}
								/>
							</div>
						))}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={onClear}
						className="w-full">
						{labels.clearAll}
					</Button>
				</>
			)}
		</div>
	);
}
