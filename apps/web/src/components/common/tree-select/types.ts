/** @format */

import { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";

type SelectionVariant = "default" | "multi-item" | "multi-path";
interface BaseTreeNode {
	name: string;
}
interface DefaultTreeNode extends BaseTreeNode {
	variant?: "default";
	children: DefaultTreeNode[];
}
interface MultiItemTreeNode extends BaseTreeNode {
	variant?: "multi-item";
	children: MultiItemTreeNode[];
}
interface MultiPathTreeNode extends BaseTreeNode {
	variant?: SelectionVariant;
	children: TreeNode[];
}
type TreeNode = DefaultTreeNode | MultiItemTreeNode | MultiPathTreeNode;

// Refactored: SelectionState as a discriminated union
interface BaseSelectionState {
	variant: SelectionVariant;
}
interface DefaultSelectionState extends BaseSelectionState {
	variant: "default";
	singlePath: string[];
}
interface MultiItemSelectionState extends BaseSelectionState {
	variant: "multi-item";
	multiItemParent: string[];
	multiItemSelected: string[];
}
interface MultiPathSelectionState extends BaseSelectionState {
	variant: "multi-path";
	multiPaths: string[][];
}
type SelectionState =
	| DefaultSelectionState
	| MultiItemSelectionState
	| MultiPathSelectionState;
interface Labels {
	placeholder: string;
	clearButton: string;
	selectedPath: string;
	selectedItems: string;
	selectedPaths: string;
	pathLabel: string;
	levelLabel: string;
	clearAll: string;
	statistics: {
		categories: string;
		items: string;
		total: string;
	};
}

type ActionSource = "internal" | "external";
interface BaseAction<
	T extends string,
	P,
	S extends ActionSource = ActionSource,
> {
	type: T;
	payload: P;
	source: S;
}

type SelectionAction =
	| BaseAction<
			"SELECT",
			{
				path: string[];
				effectiveVariant: SelectionVariant;
			}
	  >
	| BaseAction<
			"CLEAR",
			{
				currentVariant: SelectionVariant;
			}
	  >
	| BaseAction<
			"REMOVE_MULTI_ITEM",
			{
				item: string;
			}
	  >
	| BaseAction<
			"REMOVE_MULTI_PATH",
			{
				path: string[];
			}
	  >
	| BaseAction<"SET_CONTROLLED_STATE", SelectionState, "external">;

interface BaseTreeProps {
	labels?: Partial<Labels>;
	className?: string;
	data: TreeNode[];
	dropdownMenuProps?: DropdownMenuProps;
	customTrigger?: React.ReactNode;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onSelectionChange?: (selection: any) => void;
	controlledSelection?: unknown;
}

type DefaultSelection = string[];

interface MultiItemSelection {
	parentPath: string[];
	selectedItems: string[];
}

type MultiPathSelection = string[][];

interface DefaultTreeSelectionProps extends BaseTreeProps {
	variant?: "default";
	data: DefaultTreeNode[];
	onSelectionChange?: (selection: DefaultSelection) => void;
	controlledSelection?: DefaultSelection;
}

interface MultiItemTreeSelectionProps extends BaseTreeProps {
	variant: "multi-item";
	data: MultiItemTreeNode[];
	onSelectionChange?: (selection: MultiItemSelection) => void;
	controlledSelection?: MultiItemSelection;
}

interface MultiPathTreeSelectionProps extends BaseTreeProps {
	variant: "multi-path";
	data: MultiPathTreeNode[];
	onSelectionChange?: (selection: MultiPathSelection) => void;
	controlledSelection?: MultiPathSelection;
}

type TreeSelectionProps =
	| DefaultTreeSelectionProps
	| MultiItemTreeSelectionProps
	| MultiPathTreeSelectionProps;

export type {
	ActionSource,
	BaseSelectionState,
	BaseTreeNode,
	DefaultSelection,
	DefaultSelectionState,
	DefaultTreeNode,
	DefaultTreeSelectionProps,
	Labels,
	MultiItemSelection,
	MultiItemSelectionState,
	MultiItemTreeNode,
	MultiItemTreeSelectionProps,
	MultiPathSelection,
	MultiPathSelectionState,
	MultiPathTreeNode,
	MultiPathTreeSelectionProps,
	SelectionAction,
	SelectionState,
	SelectionVariant,
	TreeNode,
	TreeSelectionProps,
};
