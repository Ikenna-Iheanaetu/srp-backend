/** @format */

"use client";

/** @format */

import { type FC, useCallback, useEffect, useState } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { EMPLOYMENT_TYPE_OPTIONS } from "@/constants/data";
import { cn, replaceUnderscoresWithSpaces } from "@/lib/utils";
import type { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";

import INDUSTRIES from "@/data/industries.json";
import REGIONS from "@/data/regions.json";
import { TriggerButton, TriggerButtonLabels } from "./trigger-button";
import SPORT_CATEGORIES from "@/data/sport-categories.json";

export interface DropdownFiltersData<
	Key extends string = string,
	Values extends string[] = string[]
> {
	labels: TriggerButtonLabels<Key> & {
		menu: string;
	};
	options: { value: Values[number]; label: string }[];
}

export const clubTypeFilters = {
	labels: {
		hanging: "Clubs",
		button: "Club Type",
		menu: "Club Type",
	},
	options: SPORT_CATEGORIES.map((value) => ({ value, label: value })),
} as const satisfies DropdownFiltersData;

export const clubListFilters = {
	labels: {
		hanging: "Clubs",
		button: "Club List",
		menu: "Club List",
	},
	options: [
		{ value: "real_madrid", label: "Real Madrid" },
		{ value: "fc_barcelona", label: "FC Barcelona" },
		{ value: "manchester_united", label: "Manchester United" },
		{ value: "manchester_city", label: "Manchester City" },
		{ value: "liverpool", label: "Liverpool" },
		{ value: "chelsea", label: "Chelsea" },
		{ value: "arsenal", label: "Arsenal" },
		{ value: "bayern_munich", label: "Bayern Munich" },
		{ value: "paris_saint_germain", label: "Paris Saint-Germain (PSG)" },
		{ value: "juventus", label: "Juventus" },
	],
} as const satisfies DropdownFiltersData;

export const RegionFilters = {
	labels: {
		hanging: "Regions",
		button: "Select Regions",
		menu: "Select Regions",
	},
	options: REGIONS.map((value) => ({
		value,
		label: replaceUnderscoresWithSpaces(value),
	})),
} as const satisfies DropdownFiltersData;

export const candidatesFilters = {
	labels: {
		hanging: "Candidates",
		button: "Candidate Type",
		menu: "Select Candidates",
	},
	options: [
		{ value: "player", label: "Player" },
		{ value: "supporter", label: "Supporter" },
	],
} as const satisfies DropdownFiltersData;

export const workTypeFilters = {
	labels: {
		hanging: "Work Types",
		button: "Work Type",
		menu: "Select Work Type",
	},
	options: EMPLOYMENT_TYPE_OPTIONS.map((value) => ({
		value,
		label: replaceUnderscoresWithSpaces(value),
	})),
} as const satisfies DropdownFiltersData;

export const industryFilters = {
	labels: {
		hanging: "Industry",
		button: "Ind Type",
		menu: "Industry",
	},
	options: INDUSTRIES.map((value) => ({
		value,
		label: replaceUnderscoresWithSpaces(value),
	})),
} as const satisfies DropdownFiltersData;

// Export all filter configurations in a single object for easier mapping
export const allFilters = {
	clubTypes: clubTypeFilters,
	clubs: clubListFilters,
	regions: RegionFilters,
	candidates: candidatesFilters,
	workTypes: workTypeFilters,
	industry: industryFilters,
} as const;

// Define the filter keys type for type safety
export type FilterKey = keyof typeof allFilters;

interface FilterCheckboxItemProps
	extends Omit<DropdownMenuCheckboxItemProps, "onCheckedChange"> {
	value: string;
	isChecked: boolean;
	onValueToggle: (value: string) => void;
}

const FilterCheckboxItem: FC<FilterCheckboxItemProps> = ({
	children,
	value,
	isChecked,
	onValueToggle,
	...props
}) => {
	return (
		<DropdownMenuCheckboxItem
			{...props}
			checked={isChecked}
			onCheckedChange={() => onValueToggle(value)}
			onSelect={(event) => event.preventDefault()}
			className="[&>*:first-child]:hidden pl-2 pr-4 relative w-[90%] data-[state=checked]:!bg-lime-400/50">
			<span>{children}</span>{" "}
			<Checkbox
				checked={isChecked}
				className="absolute top-[0.125rem] right-0 translate-x-1/2 border-gray-200 bg-white data-[state=checked]:bg-green-500 [&_svg]:text-white"
			/>
		</DropdownMenuCheckboxItem>
	);
};

interface Props<Key extends string, Values extends string[]> {
	filterValues: DropdownFiltersData<Key, Values>;
	onOptionToggle?: (option: Values[number]) => void;
	selectedOptions?: Values[number][] | null;
	className?: string;
}

/**
 * @deprecated Use the compound components version in ./new.tsx
 */
const SearchFilterDropdown = <TKey extends string, TValues extends string[]>({
	filterValues,
	className,
	onOptionToggle,
	selectedOptions: externalSelectedOptions,
}: Props<TKey, TValues>) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
		new Set()
	);

	// Sync with external selected options if provided
	useEffect(() => {
		if (externalSelectedOptions) {
			setSelectedOptions(new Set(externalSelectedOptions));
		}
	}, [externalSelectedOptions]);

	const handleOptionToggle = useCallback(
		(option: string) => {
			const newSelectedOptions = new Set(selectedOptions);

			if (newSelectedOptions.has(option)) {
				newSelectedOptions.delete(option);
			} else {
				newSelectedOptions.add(option);
			}

			setSelectedOptions(newSelectedOptions);
			if (onOptionToggle) {
				onOptionToggle(option as TValues[number]);
			}
		},
		[onOptionToggle, selectedOptions]
	);

	return (
		<div className={cn("contents", className)}>
			<DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
				<DropdownMenuTrigger asChild>
					<TriggerButton labels={filterValues.labels} />
				</DropdownMenuTrigger>

				<DropdownMenuContent className="capitalize overflow-auto max-h-72 h-xs:max-h-64 pt-0 tw-scrollbar scrollbar-thumb-rounded-lg bg-gray-50">
					<div className="sticky top-0 z-10 bg-gray-50 py-2">
						<DropdownMenuLabel>
							{filterValues.labels.menu}
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-gray-200" />
					</div>

					<div className="overflow-auto flex flex-col gap-1">
						{filterValues.options.map((option) => (
							<FilterCheckboxItem
								key={option.value}
								value={option.value}
								isChecked={selectedOptions.has(option.value)}
								onValueToggle={handleOptionToggle}>
								{option.label}
							</FilterCheckboxItem>
						))}
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default SearchFilterDropdown;
