/** @format */

import {
	DebouncedInput,
	DebouncedInputProps,
} from "@/components/common/debounced-input";
import { DataTableFilter } from "@/components/data-table-filter";
import { DataTableFilterProps } from "@/components/data-table-filter/components/data-table-filter";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import React, { FC } from "react";

type TableSearchInputProps = Pick<
	DebouncedInputProps,
	"value" | "onChange" | "placeholder"
>;

const TableSearchInput: FC<TableSearchInputProps & { className?: string }> = ({
	className,
	placeholder,
	...props
}) => {
	return (
		<div className={cn("relative", className)}>
			<div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
				<Search className="h-4 w-4 text-muted-foreground" />
			</div>

			<DebouncedInput
				{...props}
				placeholder={placeholder ?? "Search..."}
				className="pl-8"
			/>
		</div>
	);
};

interface DataTableFiltersToolbarProps<TData> {
	/**Props for the table search input. */
	search?: TableSearchInputProps;
	filters?: DataTableFilterProps<TData>;
	children?: React.ReactNode;
	className?: string;
}

const _DataTableFiltersToolbar = <TData,>({
	search,
	filters,
	children,
	className,
}: DataTableFiltersToolbarProps<TData>) => {
	const shouldShowFilters = !!filters?.columns.length;

	return (
		<div
			className={cn(
				"flex flex-col gap-2 sm:flex-row flex-wrap sm:items-center sm:justify-between",
				className
			)}>
			<div className="flex flex-col gap-2 sm:flex-row flex-wrap">
				{search && <TableSearchInput {...search} />}

				{children}
			</div>

			{/* Bazza UI Filters */}
			{shouldShowFilters && <DataTableFilter {...filters} />}
		</div>
	);
};

const DataTableFiltersToolbar = React.memo(
	_DataTableFiltersToolbar
) as typeof _DataTableFiltersToolbar;

export { DataTableFiltersToolbar };
export type { DataTableFiltersToolbarProps };
