/** @format */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SafeOmit } from "@/types";
import {
	DropdownMenuCheckboxItemProps,
	DropdownMenuContentProps,
	DropdownMenuProps,
} from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import React from "react";

interface TriggerButtonLabels {
	hanging: string;
	button: string;
}

interface TriggerButtonProps
	extends SafeOmit<
		React.ComponentProps<typeof Button>,
		"children" | "asChild" | "variant"
	> {
	labels: TriggerButtonLabels;
}

export const TriggerButton: React.FC<TriggerButtonProps> = ({
	labels,
	className,
	...props
}) => {
	return (
		<Button
			{...props}
			variant="outline"
			className={cn(
				"relative py-5 border-black rounded-lg ring-0 gap-4 capitalize group",
				className
			)}>
			<div className="absolute top-0 left-4 -translate-y-1/2 bg-white group-hover:invisible px-2 py-1">
				{labels.hanging}
			</div>
			<span>{labels.button}</span>{" "}
			<ChevronDown className="group-data-[state=open]:rotate-180 transition-transform" />
		</Button>
	);
};

export const SearchFilterMenuButton: React.FC<TriggerButtonProps> = ({
	labels,
	...props
}) => {
	return (
		<DropdownMenuTrigger {...props} asChild>
			<TriggerButton labels={labels} />
		</DropdownMenuTrigger>
	);
};

interface FiltersContextType {
	selectedOptions: string[];
	setSelectedOptions: (options: string[]) => void;
}

const FiltersContext = React.createContext<FiltersContextType | null>(null);

const useFilters = () => {
	const context = React.use(FiltersContext);
	if (!context) {
		throw new Error(
			"useFilters must be used within a FiltersContext provider."
		);
	}

	return context;
};

type SearchFilterDropdownProps = DropdownMenuProps &
	Partial<FiltersContextType>;
export const SearchFilterDropdown: React.FC<SearchFilterDropdownProps> = ({
	selectedOptions: externalSelectedOptions,
	setSelectedOptions: externalSetSelectedOptions,
	...props
}) => {
	const [internalSelectedOptions, setInternalSelectedOptions] =
		React.useState<string[]>(externalSelectedOptions ?? []);

	const [selectedOptions, setSelectedOptions] = [
		externalSelectedOptions ?? internalSelectedOptions,
		externalSetSelectedOptions ?? setInternalSelectedOptions,
	];

	const contextValue = React.useMemo(
		() => ({
			selectedOptions,
			setSelectedOptions,
		}),
		[selectedOptions, setSelectedOptions]
	);

	return (
		<FiltersContext value={contextValue}>
			<DropdownMenu {...props} modal={props.modal ?? false} />
		</FiltersContext>
	);
};

export const SearchFilterMenuContent: React.FC<DropdownMenuContentProps> = ({
	className,
	...props
}) => {
	return (
		<DropdownMenuContent
			{...props}
			className={cn(
				"capitalize overflow-auto max-h-72 h-xs:max-h-64 pt-0 tw-scrollbar scrollbar-thumb-rounded-lg bg-gray-50",
				className
			)}
		/>
	);
};

interface SearchFilterContentLabelProps {
	className?: string;
	children?: React.ReactNode;
}
export const SearchFilterContentLabel: React.FC<
	SearchFilterContentLabelProps
> = ({ className, children }) => {
	return (
		<div className={cn("sticky top-0 z-10 bg-gray-50 py-2", className)}>
			<DropdownMenuLabel>{children}</DropdownMenuLabel>
			<DropdownMenuSeparator className="bg-gray-200" />
		</div>
	);
};

interface SearchFilterItemsContainerProps {
	className?: string;
	children?: React.ReactNode;
}
export const SearchFilterItemsGroup: React.FC<
	SearchFilterItemsContainerProps
> = ({ className, children }) => {
	return (
		<div className={cn("overflow-auto flex flex-col gap-1", className)}>
			{children}
		</div>
	);
};

interface SearchFilterItemProps
	extends SafeOmit<
		DropdownMenuCheckboxItemProps,
		"children" | "asChild" | "checked"
	> {
	option: string;
	label: string;
	ref?: React.Ref<HTMLDivElement>;
}

export const SearchFilterItem: React.FC<SearchFilterItemProps> = ({
	option,
	label,
	onCheckedChange,
	onSelect,
	className,
	ref,
	...props
}) => {
	const { selectedOptions, setSelectedOptions } = useFilters();
	const isChecked = React.useMemo(
		() => selectedOptions.includes(option),
		[option, selectedOptions]
	);

	const onOptionToggle = () => {
		if (isChecked) {
			setSelectedOptions(selectedOptions.filter((op) => op !== option));
		} else {
			setSelectedOptions([...selectedOptions, option]);
		}
	};

	return (
		<DropdownMenuCheckboxItem
			{...props}
			ref={ref}
			checked={isChecked}
			onCheckedChange={(checked) => {
				onOptionToggle();
				onCheckedChange?.(checked);
			}}
			onSelect={(event) => {
				event.preventDefault();
				onSelect?.(event);
			}}
			className={cn(
				"[&>*:first-child]:hidden pl-2 pr-4 relative w-[90%] data-[state=checked]:!bg-lime-400/50",
				className
			)}>
			<span>{label}</span>{" "}
			<Checkbox
				checked={isChecked}
				className="absolute top-[0.125rem] right-0 translate-x-1/2 border-gray-200 bg-white data-[state=checked]:bg-green-500 [&_svg]:text-white"
			/>
		</DropdownMenuCheckboxItem>
	);
};
