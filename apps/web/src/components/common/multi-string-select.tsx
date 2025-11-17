/** @format */

import { BadgeItemsList } from "@/components/common/badge-list";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PencilLine, Plus } from "lucide-react";
import React from "react";

interface MultiStringSelectProps {
	options: string[];
	selectedOptions?: string[];
	onChange?: (selectedValues: string[]) => void;
	label?: string;
	placeholder?: string;
	maxSelections?: number;
	disabled?: boolean;
	addButtonText?: string;
	updateButtonText?: string;
	selectedLabel?: string;
	filteredLabel?: string;
}

interface SelectedItemsSubMenuProps {
	selectedItems: string[];
	onToggleItem: (item: string) => void;
	selectedLabel: string;
}

const SelectedItemsSubMenu: React.FC<SelectedItemsSubMenuProps> = ({
	selectedItems,
	onToggleItem,
	selectedLabel,
}) => {
	return (
		!!selectedItems?.length && (
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					{selectedLabel}: {selectedItems.length}
				</DropdownMenuSubTrigger>

				<DropdownMenuPortal>
					<DropdownMenuSubContent>
						<DropdownMenuLabel>{selectedLabel}</DropdownMenuLabel>

						{selectedItems.map((item) => {
							if (!item) {
								return null;
							}

							const isSelected = selectedItems.includes(item);

							return (
								<DropdownMenuCheckboxItem
									key={item}
									checked={isSelected}
									onCheckedChange={() => onToggleItem(item)}
									onSelect={(e) => {
										e.preventDefault();
									}}>
									{item}
								</DropdownMenuCheckboxItem>
							);
						})}
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>
		)
	);
};

/**@deprecated Use {@link MultiOptionsSelect} instead. */
export const MultiStringSelect: React.FC<MultiStringSelectProps> = ({
	options,
	selectedOptions: selectedOptions = [],
	onChange,
	placeholder = "Search items",
	maxSelections = 5,
	disabled = false,
	addButtonText = "Add item",
	updateButtonText = "Update",
	selectedLabel = "Selected items",
	filteredLabel = "Filtered items",
}) => {
	const [search, setSearch] = React.useState("");

	const filteredItems = React.useMemo(
		() =>
			options.filter((item) =>
				item.toLowerCase().includes(search.toLowerCase())
			),
		[search, options]
	);

	const selectedItems = selectedOptions.filter(Boolean);

	const handleToggleItem = React.useCallback(
		(item: string) => {
			if (!onChange) return;

			const isSelected = selectedItems.includes(item);
			if (isSelected) {
				onChange(selectedItems.filter((i) => i !== item));
			} else {
				if (selectedItems.length < maxSelections) {
					onChange([...selectedItems, item]);
				}
			}
		},
		[selectedItems, onChange, maxSelections]
	);

	const handleRemoveItem = React.useCallback(
		(item: string) => {
			if (!onChange) return;
			onChange(selectedItems.filter((i) => i !== item));
		},
		[selectedItems, onChange]
	);

	return (
		<DropdownMenu>
			<div className="flex w-full flex-wrap gap-2">
				{!!selectedItems?.length && (
					<BadgeItemsList
						items={selectedItems}
						onRemove={handleRemoveItem}
						removable={true}
					/>
				)}
				<DropdownMenuTrigger asChild>
					<Button type="button" variant="ghost" disabled={disabled}>
						{selectedItems?.length ? (
							<>
								<PencilLine className="mr-1 h-4 w-4" />
								{updateButtonText}
							</>
						) : (
							<>
								<Plus className="mr-1 h-4 w-4" />
								{addButtonText}
							</>
						)}
					</Button>
				</DropdownMenuTrigger>
			</div>
			<DropdownMenuContent className="relative space-y-4 tw-scrollbar">
				<DropdownMenuGroup
					className="space-y-2 sticky top-0 z-[50] bg-white"
					onKeyDown={(e) => {
						// to avoid dropdown item from stealing focus from input
						e.stopPropagation();
					}}>
					<Input
						placeholder={placeholder}
						onChange={(e) => {
							setSearch(e.target.value);
						}}
					/>

					<SelectedItemsSubMenu
						selectedItems={selectedItems}
						onToggleItem={handleToggleItem}
						selectedLabel={selectedLabel}
					/>
					<DropdownMenuSeparator />
				</DropdownMenuGroup>

				<DropdownMenuGroup>
					<DropdownMenuLabel>{filteredLabel}</DropdownMenuLabel>

					{filteredItems.map((item) => {
						const isSelected = selectedItems?.includes(item);
						const shouldDisable = !!(
							!isSelected &&
							selectedItems &&
							selectedItems.length >= maxSelections
						);

						return (
							<DropdownMenuCheckboxItem
								key={item}
								checked={isSelected}
								onCheckedChange={() => handleToggleItem(item)}
								onSelect={(e) => {
									e.preventDefault();
								}}
								disabled={shouldDisable || disabled}>
								{item}
							</DropdownMenuCheckboxItem>
						);
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
