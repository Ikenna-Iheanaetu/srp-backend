/** @format */

import { cn } from "@/lib/utils";
import { DEFAULT_LABELS } from "./constants";
import { Labels, TreeNode } from "./types";

const countBranchNodes = (nodes: TreeNode[]): number => {
	return nodes.reduce((count, node) => {
		return node.children.length > 0
			? count + 1 + countBranchNodes(node.children)
			: count;
	}, 0);
};

const countLeafNodes = (nodes: TreeNode[]): number => {
	return nodes.reduce((count, node) => {
		return node.children.length === 0
			? count + 1
			: count + countLeafNodes(node.children);
	}, 0);
};

const countNodes = (nodes: TreeNode[]): number => {
	return nodes.reduce(
		(count, node) => count + 1 + countNodes(node.children),
		0
	);
};

interface TreeStatisticsProps {
	data: TreeNode[];
	labels?: Partial<Labels>;
	className?: string;
}

export function TreeStatistics({
	data,
	labels: customLabels,
	className,
}: TreeStatisticsProps) {
	const labels: Required<Labels> = { ...DEFAULT_LABELS, ...customLabels };

	return (
		<div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
			<div className="text-center p-4 bg-muted rounded-lg">
				<div className="text-2xl font-bold text-primary">
					{countBranchNodes(data)}
				</div>
				<div className="text-sm text-muted-foreground">
					{labels.statistics.categories}
				</div>
			</div>
			<div className="text-center p-4 bg-muted rounded-lg">
				<div className="text-2xl font-bold text-primary">
					{countLeafNodes(data)}
				</div>
				<div className="text-sm text-muted-foreground">
					{labels.statistics.items}
				</div>
			</div>
			<div className="text-center p-4 bg-muted rounded-lg">
				<div className="text-2xl font-bold text-primary">
					{countNodes(data)}
				</div>
				<div className="text-sm text-muted-foreground">
					{labels.statistics.total}
				</div>
			</div>
		</div>
	);
}
