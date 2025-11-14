/** @format */

import { TreeNode } from "./types";

/**Helper function to build a new {@link TreeNode}[] with a limited depth
 * @param maxLevel Zero-based number.
 */
export const buildLimitedTree = <TTreeNode extends TreeNode>(
	nodes: TTreeNode[],
	maxLevel: number,
	currentLevel = 0
): TTreeNode[] => {
	// Use Array.prototype.map to transform each node at the current level
	return nodes.map((node) => {
		const newNode: typeof node = {
			...node,
			children: [],
		};

		// Recursively process children if within the depth limit and children exist
		if (
			currentLevel < maxLevel &&
			node.children &&
			node.children.length > 0
		) {
			newNode.children = buildLimitedTree(
				node.children,
				maxLevel,
				currentLevel + 1
			);
		} else {
			// If at or beyond maxLevel, or no children, prune the children
			newNode.children = [];
		}
		return newNode;
	});
};
