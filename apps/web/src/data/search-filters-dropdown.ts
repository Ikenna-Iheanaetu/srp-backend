/** @format */

import { TreeFiltersDropdownData } from "@/components/common/search-filters-dropdown/tree-filter-dropdown";
import { COMPANY_INDUSTRY_TREE, PLAYER_INDUSTRY_TREE } from "./tree-data";

/**Industry tree filters for player and supporter */
export const PLAYER_INDUSTRY_TREE_FILTERS = {
	labels: {
		hanging: "Role",
		button: "Role",
		menu: "Role",
	},
	options: PLAYER_INDUSTRY_TREE,
} as const satisfies TreeFiltersDropdownData;

export const COMPANY_INDUSTRY_TREE_FILTERS = {
	labels: {
		hanging: "Industry",
		button: "Ind Type",
		menu: "Industry",
	},
	options: COMPANY_INDUSTRY_TREE,
} as const satisfies TreeFiltersDropdownData;
