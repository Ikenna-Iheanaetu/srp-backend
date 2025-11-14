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

export interface MultiSelectOption {
	value: string;
	label: string;
}

export interface MultiOptionsSelectProps {
	options: MultiSelectOption[];
	selectedOptions?: MultiSelectOption[];
	onChange?: (selectedValues: MultiSelectOption[]) => void;
	searchInputPlaceholder?: string;
	maxSelections?: number;
	disabled?: boolean;
	addButtonText?: string;
	updateButtonText?: string;
	selectedLabel?: string;
	filteredLabel?: string;
}

interface SelectedItemsSubMenuProps {
	selectedItems: MultiSelectOption[];
	onToggleItem: (item: MultiSelectOption) => void;
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
							const isSelected = selectedItems.some(
								(i) => i.value === item.value
							);

							return (
								<DropdownMenuCheckboxItem
									key={item.value}
									checked={isSelected}
									onCheckedChange={() => onToggleItem(item)}
									onSelect={(e) => {
										e.preventDefault();
									}}>
									{item.label}
								</DropdownMenuCheckboxItem>
							);
						})}
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>
		)
	);
};

export const MultiOptionsSelect: React.FC<MultiOptionsSelectProps> = ({
	options,
	selectedOptions = [],
	onChange,
	searchInputPlaceholder = "Search items",
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
				item.label.toLowerCase().includes(search.toLowerCase())
			),
		[search, options]
	);

	const handleToggleItem = React.useCallback(
		(item: MultiSelectOption) => {
			if (!onChange) return;

			const isSelected = selectedOptions.some(
				(selectedItem) => selectedItem.value === item.value
			);
			if (isSelected) {
				onChange(selectedOptions.filter((i) => i.value !== item.value));
			} else {
				if (selectedOptions.length < maxSelections) {
					onChange([...selectedOptions, item]);
				}
			}
		},
		[selectedOptions, onChange, maxSelections]
	);

	const handleRemoveItem = React.useCallback(
		(item: MultiSelectOption) => {
			if (!onChange) return;
			onChange(selectedOptions.filter((i) => i.value !== item.value));
		},
		[selectedOptions, onChange]
	);

	return (
		<DropdownMenu>
			<div className="flex w-full flex-wrap gap-2">
				{!!selectedOptions?.length && (
					<BadgeItemsList
						items={selectedOptions.map((item) => item.label)}
						onRemove={(label) => {
							const itemToRemove = selectedOptions.find(
								(item) => item.label === label
							);
							if (itemToRemove) {
								handleRemoveItem(itemToRemove);
							}
						}}
						removable={true}
					/>
				)}
				<DropdownMenuTrigger asChild>
					<Button type="button" variant="ghost" disabled={disabled}>
						{selectedOptions?.length ? (
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
						e.stopPropagation();
					}}>
					<Input
						placeholder={searchInputPlaceholder}
						onChange={(e) => {
							setSearch(e.target.value);
						}}
					/>

					<SelectedItemsSubMenu
						selectedItems={selectedOptions}
						onToggleItem={handleToggleItem}
						selectedLabel={selectedLabel}
					/>
					<DropdownMenuSeparator />
				</DropdownMenuGroup>

				<DropdownMenuGroup>
					<DropdownMenuLabel>{filteredLabel}</DropdownMenuLabel>

					{filteredItems.map((item) => {
						const isSelected = selectedOptions?.some(
							(selectedItem) => selectedItem.value === item.value
						);
						const shouldDisable = !!(
							!isSelected &&
							selectedOptions &&
							selectedOptions.length >= maxSelections
						);

						return (
							<DropdownMenuCheckboxItem
								key={item.value}
								checked={isSelected}
								onCheckedChange={() => handleToggleItem(item)}
								onSelect={(e) => {
									e.preventDefault();
								}}
								disabled={shouldDisable || disabled}>
								{item.label}
							</DropdownMenuCheckboxItem>
						);
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
