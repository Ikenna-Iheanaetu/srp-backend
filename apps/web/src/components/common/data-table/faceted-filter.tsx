/** @format */
import { Column } from "@tanstack/react-table";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Separator } from "../../ui/separator";
import { useEffect } from "react";

export interface FacetedFilterOption {
	label: string;
	value: string;
	/* icon?: React.ComponentType<{ className?: string }>; */
}

interface DataTableFacetedFilterProps<TData, TValue> {
	column: Column<TData, TValue>;
	title: string;
	options: FacetedFilterOption[];
}

/**
 * Props for the DataTableFacetedFilter component.
 * @template TData - The type of the data in the table rows.
 * @template TValue - The type of the values in the column.
 * @property {Column<TData, TValue>} column - The TanStack Table column object to filter.
 * @property {string} title - The title displayed on the filter button.
 * @property {FacetedFilterOption[]} options - An array of filter options.
 * Each option has a `label` (display text) and a `value` (filterable value).
 *
 * @remarks
 * To enable column faceting (e.g., `column.getFacetedUniqueValues()` used in this component),
 * you must configure your table with the following TanStack Table row models:
 * - `getFacetedRowModel`: Required for all faceting features. Include it in `useReactTable` options as `getFacetedRowModel: getFacetedRowModel()`.
 * - `getFacetedUniqueValues`: Required for generating unique value counts (used here). Include as `getFacetedUniqueValues: getFacetedUniqueValues()`.
 * - `getCoreRowModel`: Required for basic table functionality, as a prerequisite for faceting.
 * Additionally, a custom `filterFn` must be provided in the column definition for faceted filtering to work correctly.
 * If no `filterFn` is defined, a warning will be logged.
 *
 * @see {@link https://tanstack.com/table/v8/docs/guide/column-faceting#column-faceting-row-models}
 *
 * @example
 * ```typescript
 * const table = useReactTable({
 *   data,
 *   columns,
 *   getCoreRowModel: getCoreRowModel(),
 *   getFacetedRowModel: getFacetedRowModel(),
 *   getFacetedUniqueValues: getFacetedUniqueValues(),
 * });
 * ```
 *
 * @example
 * // Static options example:
 * const statusOptions = [
 *   { label: "In Progress", value: "in-progress" },
 *   { label: "Pending", value: "pending" },
 *   { label: "Completed", value: "completed" },
 * ];
 *
 * @example
 * // Dynamically generating options from facets:
 * const column = table.getColumn("status");
 * const facets = column?.getFacetedUniqueValues(); // Map<string, number>
 * const dynamicOptions = facets
 *   ? Array.from(facets.keys()).map((value) => ({
 *       label: value
 *         .replace(/([A-Z])/g, " $1") // Add space before uppercase letters
 *         .trim() // Remove leading/trailing spaces
 *         .replace(/^./, (str) => str.toUpperCase()), // Capitalize first letter
 *       value,
 *     }))
 *   : [];
 * // Result: [{ label: "In Progress", value: "in-progress" }, ...] based on data
 */
export function DataTableFacetedFilter<TData, TValue>({
	column,
	title,
	options,
}: DataTableFacetedFilterProps<TData, TValue>) {
	// Check if any filter function is available for the column
	useEffect(() => {
		// Check if the column can be filtered
		if (!column.getCanFilter()) {
			console.warn(
				`[DataTableFacetedFilter] Column "${column.id}" cannot be filtered. Faceted filtering will not work. Make sure a filter function is available.`
			);
			return;
		}

		// Get the filter function details
		const filterFn = column.getFilterFn();
		const columnDefFilterFn = column.columnDef.filterFn;

		// Check the source of the filter function
		if (!columnDefFilterFn && filterFn) {
			// Using global filter function
			console.info(
				`[DataTableFacetedFilter] Column "${column.id}" is using the globally defined filter function. Make sure this is appropriate for faceted filtering of the column.`
			);
		} else if (typeof columnDefFilterFn === "string") {
			// Using built-in filter function
			console.info(
				`[DataTableFacetedFilter] Column "${column.id}" is using the built-in filter function: "${columnDefFilterFn}". Make sure this is appropriate for faceted filtering of the column.`
			);
		} else if (typeof columnDefFilterFn === "function") {
			// Using custom filter function
			console.info(
				`[DataTableFacetedFilter] Column "${column.id}" is using a custom filter function`
			);
		}

		// Check if faceting features are enabled
		if (!column.getFacetedUniqueValues) {
			console.warn(
				`[DataTableFacetedFilter] Column "${column.id}" does not have getFacetedUniqueValues available. Make sure you've enabled getFacetedUniqueValues() in your table configuration.`
			);
		}
	}, [column]);

	const facets = column.getFacetedUniqueValues();
	const selectedValues = new Set(column?.getFilterValue() as string[]);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="h-8">
					{title}
					<ChevronDown />
					{selectedValues?.size > 0 && (
						<>
							<Separator
								orientation="vertical"
								className="mx-2 h-4"
							/>
							<Badge
								variant="secondary"
								className="rounded-sm px-1 font-normal lg:hidden">
								{selectedValues.size}
							</Badge>
							<div className="hidden space-x-1 lg:flex">
								{selectedValues.size > 2 ? (
									<Badge
										variant="secondary"
										className="rounded-sm px-1 font-normal">
										{selectedValues.size} selected
									</Badge>
								) : (
									options
										.filter((option) =>
											selectedValues.has(option.value)
										)
										.map((option) => (
											<Badge
												variant="secondary"
												key={option.value}
												className="rounded-sm px-1 font-normal">
												{option.label}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					<CommandInput placeholder={title} />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = selectedValues.has(
									option.value
								);
								return (
									<CommandItem
										key={option.value}
										onSelect={() => {
											if (isSelected) {
												selectedValues.delete(
													option.value
												);
											} else {
												selectedValues.add(
													option.value
												);
											}
											const filterValues =
												Array.from(selectedValues);
											column?.setFilterValue(
												filterValues.length
													? filterValues
													: undefined
											);
										}}>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible"
											)}>
											<Check />
										</div>
										{/* {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )} */}
										<span>{option.label}</span>
										{facets?.has(option.value) && (
											<span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
												{facets.get(option.value)}
											</span>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
						{selectedValues.size > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										onSelect={() =>
											column?.setFilterValue(undefined)
										}
										className="justify-center text-center">
										Clear filters
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
