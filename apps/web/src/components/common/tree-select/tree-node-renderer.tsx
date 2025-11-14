/** @format */
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import * as React from "react";
import { SelectionVariant, TreeNode } from "./types";

const getEffectiveVariant = (
	globalVariant: SelectionVariant,
	nodeVariant?: SelectionVariant
): SelectionVariant => {
	return globalVariant === "multi-path" && nodeVariant
		? nodeVariant
		: globalVariant;
};

const ArrowIndicators: React.FC<{ level: number }> = ({ level }) => {
	const maxArrows = 5;
	const arrowCount = Math.min(level, maxArrows);
	const remainingLevels = Math.max(0, level - maxArrows);

	return (
		<div className="flex items-center gap-0.5">
			{Array.from({ length: arrowCount }, (_, i) => (
				<ChevronRight key={i} className="h-3 w-3" />
			))}
			{remainingLevels > 0 && (
				<span className="text-xs text-muted-foreground ml-1">
					+{remainingLevels}
				</span>
			)}
		</div>
	);
};

interface TreeNodeRendererProps {
	nodes: TreeNode[];
	currentPath: string[];
	level: number;
	parentVariant: SelectionVariant;
	checkIsSelected: (
		path: string[],
		effectiveVariant: SelectionVariant
	) => boolean;
	handleSelection: (
		path: string[],
		effectiveVariant: SelectionVariant
	) => void;
}

const TreeNodeRenderer_: React.FC<TreeNodeRendererProps> = (props) => {
	const {
		nodes,
		currentPath,
		level,
		parentVariant,
		checkIsSelected,
		handleSelection,
	} = props;

	return nodes.map((node) => {
		const nodePath = [...currentPath, node.name];
		const isLeaf = node.children.length === 0;
		const effectiveVariant = getEffectiveVariant(
			parentVariant,
			node.variant
		);
		const selected = checkIsSelected(nodePath, effectiveVariant);

		if (isLeaf) {
			return (
				<DropdownMenuItem
					key={node.name}
					onClick={(e) => {
						handleSelection(nodePath, effectiveVariant);
						if (
							effectiveVariant === "multi-item" ||
							effectiveVariant === "multi-path"
						) {
							// prevent closing the select menu
							e.preventDefault();
							e.stopPropagation();
						}
					}}
					className={cn(
						"cursor-pointer flex items-center gap-3 py-3 px-4 hover:bg-accent focus:bg-accent",
						selected &&
							"bg-blue-700 !text-white hover:bg-blue-800 focus:bg-blue-800"
					)}>
					<Checkbox
						checked={selected}
						className={cn(
							"h-4 w-4 shrink-0",
							selected &&
								"border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-700"
						)}
					/>
					<span className="flex-1 text-left">{node.name}</span>
				</DropdownMenuItem>
			);
		}

		const newLevel = level + 1;
		return (
			<DropdownMenuSub key={node.name}>
				<DropdownMenuSubTrigger className="flex items-center justify-between py-2 px-4">
					<span className="truncate">{node.name}</span>
					<ArrowIndicators level={newLevel} />
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className="w-72 tw-scrollbar">
					<TreeNodeRenderer_
						{...props}
						nodes={node.children}
						currentPath={nodePath}
						level={newLevel}
						parentVariant={effectiveVariant}
					/>
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		);
	});
};

export const TreeNodeRenderer = React.memo(
	TreeNodeRenderer_
) as typeof TreeNodeRenderer_;

TreeNodeRenderer.displayName = "TreeNodeRenderer";
