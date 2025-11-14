/** @format */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search, X } from "lucide-react";
import React from "react";

interface JobTaxonomy {
	name: string;
	children: JobTaxonomy[] | null;
}

const HIERARCHICAL_PATH_SEPARATOR = ":::|:::";
type HierarchicalPathSeparator = typeof HIERARCHICAL_PATH_SEPARATOR;

/**Has a max of 3 levels */
export type HierarchicalPath =
	// max 3 levels
	| `${string}${HierarchicalPathSeparator}${string}${HierarchicalPathSeparator}${string}`
	// 2 levels
	| `${string}${HierarchicalPathSeparator}${string}`
	// 1 level
	| Brand<string, "ROOT_HierarchicalPath">;

type HierarchicalDropdownProps = {
	data: JobTaxonomy[];
	placeholder?: string;
	searchPlaceholder?: string;
	excludedPaths?: HierarchicalPath[];
} & (
	| {
			variant?: "single-select";
			selectedPath?: HierarchicalPath | null;
			onSelectPath?: (path: HierarchicalPath | null) => void;
			selectedPaths?: never;
			onSelectPaths?: never;
			maxSelections?: never;
	  }
	| {
			variant: "multi-select";
			selectedPaths?: HierarchicalPath[];
			onSelectPaths?: (paths: HierarchicalPath[]) => void;
			selectedPath?: never;
			onSelectPath?: never;
			maxSelections?: number;
	  }
);

export const getPathName = (path: HierarchicalPath) => {
	const parts = path.split(HIERARCHICAL_PATH_SEPARATOR);
	if (parts.length === 0) {
		// this is the root path
		return path;
	}
	return parts[parts.length - 1];
};

interface FlattenedHierarchy {
	item: JobTaxonomy;
	path: HierarchicalPath;
	fullPath: string;
}
const flattenHierarchy = ({
	items,
	parentPath,
}: {
	items: JobTaxonomy[];
	parentPath?: HierarchicalPath;
}): FlattenedHierarchy[] => {
	const result: FlattenedHierarchy[] = [];

	items.forEach((item) => {
		const currentPath = parentPath
			? (`${parentPath}${HIERARCHICAL_PATH_SEPARATOR}${item.name}` as const)
			: (item.name as HierarchicalPath);

		const pathParts = currentPath.split(HIERARCHICAL_PATH_SEPARATOR);
		const READABLE_PATH_SEPARATOR = " > ";
		const fullPath = pathParts.join(READABLE_PATH_SEPARATOR);

		result.push({ item, path: currentPath, fullPath });

		if (item.children && item.children.length > 0) {
			result.push(
				...flattenHierarchy({
					items: item.children,
					parentPath: currentPath,
				}),
			);
		}
	});

	return result;
};

const filterItemsBySearch = ({
	items,
	searchTerm,
}: {
	items: JobTaxonomy[];
	searchTerm: string;
}): FlattenedHierarchy[] => {
	if (!searchTerm.trim()) return [];

	const flattened = flattenHierarchy({ items });
	const lowercaseSearch = searchTerm.toLowerCase();

	return flattened.filter(
		({ item, fullPath }) =>
			item.name.toLowerCase().includes(lowercaseSearch) ||
			fullPath.toLowerCase().includes(lowercaseSearch),
	);
};

const HierarchicalDropdownContent: React.FC<
	Pick<
		HierarchicalDropdownProps,
		| "data"
		| "selectedPath"
		| "onSelectPath"
		| "selectedPaths"
		| "onSelectPaths"
		| "variant"
		| "searchPlaceholder"
		| "excludedPaths"
		| "maxSelections"
	>
> = ({
	data,
	selectedPath,
	onSelectPath,
	selectedPaths,
	onSelectPaths,
	variant = "single-select",
	searchPlaceholder = "Search...",
	excludedPaths = [],
	maxSelections,
}) => {
	const isPathSelected = React.useCallback(
		(path: HierarchicalPath) => {
			if (variant === "multi-select") {
				return selectedPaths?.includes(path) ?? false;
			}
			return selectedPath === path;
		},
		[variant, selectedPath, selectedPaths],
	);

	const isPathExcluded = React.useCallback(
		(path: HierarchicalPath) => {
			return excludedPaths.includes(path);
		},
		[excludedPaths],
	);

	const isMaxSelectionsReached = React.useMemo(() => {
		if (variant === "multi-select" && maxSelections) {
			return (selectedPaths?.length ?? 0) >= maxSelections;
		}
		return false;
	}, [variant, maxSelections, selectedPaths]);

	const handleToggleSelection = React.useCallback(
		(path: HierarchicalPath) => {
			if (isPathExcluded(path)) return;

			if (isPathSelected(path)) {
				// remove from selection
				if (variant === "multi-select") {
					onSelectPaths?.(
						selectedPaths?.filter((p) => p !== path) ?? [],
					);
					return;
				}
				onSelectPath?.(null);
			} else {
				// Add to selection

				if (variant === "multi-select") {
					if (!isMaxSelectionsReached) {
						onSelectPaths?.([...(selectedPaths ?? []), path]);
					}
					return;
				}
				onSelectPath?.(path);
			}
		},
		[
			isPathExcluded,
			isPathSelected,
			variant,
			onSelectPath,
			onSelectPaths,
			selectedPaths,
			isMaxSelectionsReached,
		],
	);

	const [searchTerm, setSearchTerm] = React.useState("");

	const renderSearchResults = React.useCallback(() => {
		const filteredItems = filterItemsBySearch({ items: data, searchTerm });

		if (filteredItems.length === 0) {
			return (
				<DropdownMenuItem disabled className="text-muted-foreground">
					No results found
				</DropdownMenuItem>
			);
		}

		return filteredItems.map(({ item, path, fullPath }) => {
			const isSelected = isPathSelected(path);
			const isExcluded = isPathExcluded(path);
			const isDisabled =
				isExcluded || (isMaxSelectionsReached && !isSelected);

			return (
				<DropdownMenuItem
					key={path}
					onClick={() => handleToggleSelection(path)}
					onSelect={(e) => {
						// Stop the dropdown from closing
						if (variant === "multi-select") {
							e.preventDefault();
						}
					}}
					disabled={isDisabled}
					className={cn(
						"flex cursor-pointer flex-col items-start gap-1 py-3",
						isDisabled && "cursor-not-allowed opacity-50",
					)}>
					<div className="flex w-full items-center justify-between">
						<span className="font-medium">{item.name}</span>
						{isSelected && (
							<Check className="text-primary h-4 w-4" />
						)}
					</div>
					<span className="text-muted-foreground w-full truncate text-xs">
						{fullPath}
					</span>
				</DropdownMenuItem>
			);
		});
	}, [
		data,
		searchTerm,
		isPathSelected,
		isPathExcluded,
		isMaxSelectionsReached,
		handleToggleSelection,
		variant,
	]);

	const renderDropdownItems = React.useCallback(
		({
			items,
			parentPath,
		}: {
			items: JobTaxonomy[];
			parentPath?: HierarchicalPath;
		}): React.JSX.Element[] => {
			return items.map((item) => {
				const currentPath = parentPath
					? (`${parentPath}${HIERARCHICAL_PATH_SEPARATOR}${item.name}` as const)
					: (item.name as HierarchicalPath);

				if (item.children && item.children.length > 0) {
					return (
						<DropdownMenuSub key={item.name}>
							<DropdownMenuSubTrigger className="flex items-center">
								{item.name}
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="max-h-80 w-72 overflow-y-auto tw-scrollbar">
								{renderDropdownItems({
									items: item.children,
									parentPath: currentPath,
								})}
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					);
				}

				const isSelected = isPathSelected(currentPath);
				const isExcluded = isPathExcluded(currentPath);
				const isDisabled =
					isExcluded || (isMaxSelectionsReached && !isSelected);

				return (
					<DropdownMenuItem
						key={currentPath}
						onClick={() => handleToggleSelection(currentPath)}
						onSelect={(e) => {
							// Stop the dropdown from closing
							if (variant === "multi-select") {
								e.preventDefault();
							}
						}}
						className={cn(
							"cursor-pointer",
							isDisabled && "cursor-not-allowed opacity-50",
						)}>
						{item.name}
						{isPathSelected(currentPath) && (
							<Check className="text-primary h-4 w-4" />
						)}
					</DropdownMenuItem>
				);
			});
		},
		[
			handleToggleSelection,
			isMaxSelectionsReached,
			isPathExcluded,
			isPathSelected,
			variant,
		],
	);

	return (
		<DropdownMenuContent className="max-h-96 w-80 overflow-y-auto tw-scrollbar">
			<div className="border-b p-2">
				<div
					className="relative"
					onKeyDown={(e) => {
						// To prevent dropdown items from stealing focus from input when typing
						e.stopPropagation();
					}}>
					<Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
					<Input
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-8"
						autoFocus
					/>
				</div>

				{variant === "multi-select" && maxSelections && (
					<div className="text-muted-foreground mt-1 text-center text-xs">
						{selectedPaths?.length ?? 0} of {maxSelections} selected
					</div>
				)}
			</div>

			{searchTerm.trim() ? (
				<div className="p-1">{renderSearchResults()}</div>
			) : (
				<div className="p-1">
					{renderDropdownItems({ items: data })}
				</div>
			)}
		</DropdownMenuContent>
	);
};

export function JobTaxonomyDropdown({
	data,
	selectedPath: externalSelectedPath,
	onSelectPath,
	placeholder = "Select a job category",
	variant = "single-select",
	selectedPaths: externalSelectedPaths,
	onSelectPaths,
	searchPlaceholder,
	excludedPaths = [],
	maxSelections,
}: HierarchicalDropdownProps) {
	const [internalPath, setInternalPath] =
		React.useState<HierarchicalPath | null>(null);
	const [internalPaths, setInternalPaths] = React.useState<
		HierarchicalPath[]
	>([]);

	const [selectedPath, setSelectedPath] =
		variant === "single-select"
			? [
					externalSelectedPath ?? internalPath,
					onSelectPath ?? setInternalPath,
				]
			: // eslint-disable-next-line @typescript-eslint/no-empty-function
				[null, () => {}];

	const [selectedPaths, setSelectedPaths] =
		variant === "multi-select"
			? [
					externalSelectedPaths ?? internalPaths,
					onSelectPaths ?? setInternalPaths,
				]
			: // eslint-disable-next-line @typescript-eslint/no-empty-function
				[[], () => {}];

	const removeSelection = React.useCallback(
		(pathToRemove: HierarchicalPath) => {
			if (variant === "multi-select") {
				setSelectedPaths(
					selectedPaths.filter((path) => path !== pathToRemove),
				);
			}
		},
		[selectedPaths, setSelectedPaths, variant],
	);

	const clearAllSelections = React.useCallback(() => {
		if (variant === "multi-select") {
			setSelectedPaths([]);
		} else {
			setSelectedPath(null);
		}
	}, [variant, setSelectedPaths, setSelectedPath]);

	const renderTriggerContent = () => {
		if (variant === "multi-select") {
			if (selectedPaths.length === 0) {
				return <span className="truncate">{placeholder}</span>;
			}

			if (selectedPaths.length === 1) {
				return (
					<span className="truncate">
						{getPathName(selectedPaths[0]!)}
					</span>
				);
			}

			return (
				<div className="flex min-w-0 flex-1 items-center gap-1">
					<span className="truncate">
						{selectedPaths.length} selected
					</span>
				</div>
			);
		}

		return (
			<span className="truncate">
				{selectedPath ? getPathName(selectedPath) : placeholder}
			</span>
		);
	};

	return (
		<div className="w-full">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						className="justify-between bg-transparent">
						{renderTriggerContent()}
						<ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
					</Button>
				</DropdownMenuTrigger>

				<HierarchicalDropdownContent
					data={data}
					selectedPath={selectedPath}
					selectedPaths={selectedPaths}
					onSelectPath={setSelectedPath}
					onSelectPaths={setSelectedPaths}
					variant={variant}
					searchPlaceholder={searchPlaceholder}
					excludedPaths={excludedPaths}
					maxSelections={maxSelections}
				/>
			</DropdownMenu>

			{variant === "multi-select" && selectedPaths.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-1">
					{selectedPaths.map((path) => (
						<Badge
							key={path}
							variant="secondary"
							className="flex max-w-xs items-center gap-1">
							<span className="truncate">
								{getPathName(path)}
							</span>
							<X
								className="hover:text-destructive h-3 w-3 cursor-pointer"
								onClick={() => removeSelection(path)}
							/>
						</Badge>
					))}
					{selectedPaths.length > 1 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearAllSelections}
							className="h-6 px-2 text-xs">
							Clear all
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
