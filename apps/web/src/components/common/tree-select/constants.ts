/** @format */

import { Labels } from "./types";

export const DEFAULT_LABELS = {
	placeholder: "Choose an option",
	clearButton: "Clear Selection",
	selectedPath: "Selected Path:",
	selectedItems: "Selected Items:",
	selectedPaths: "Selected Paths:",
	pathLabel: "Path:",
	levelLabel: "Level",
	clearAll: "Clear All",
	statistics: {
		categories: "Categories",
		items: "Items",
		total: "Total Items",
	},
} as const satisfies Required<Labels>;
