/** @format */

"use client";

/** @format */

import type { Column, Row, Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchByURLParams } from "@/hooks/use-search-by-url-params";
import { useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "../date-range-picker";
import {
	DataTableFacetedFilter,
	type FacetedFilterOption,
} from "./faceted-filter";

interface ToolbarInputProps<TData> {
	table: Table<TData>;
}

const ToolbarInput = <TData,>({ table }: ToolbarInputProps<TData>) => {
	const { searchQuery, handleSearchChange } = useSearchByURLParams();

	useEffect(() => {
		table.setGlobalFilter(searchQuery);
	}, [searchQuery, table]);

	return (
		<Input
			value={searchQuery}
			onChange={(event) => handleSearchChange(event.target.value)}
			placeholder="Search table for filters..."
			className="h-8 w-full pl-8" // Added left padding for the icon
		/>
	);
};

// Utility to check if a value can be parsed as a date
const isDateValue = (value: unknown): boolean => {
	// Handle null/undefined
	if (value == null) return false;

	// Handle Date objects directly
	if (value instanceof Date) return !isNaN(value.getTime());

	// Only allow string or number types for conversion
	if (typeof value !== "string" && typeof value !== "number") {
		return false;
	}

	// Convert and validate
	const date = new Date(value);
	return !isNaN(date.getTime());
};

type ConfigStringLiteral<TData> = keyof TData & string;

// Config for faceted filters
interface FacetedFilterConfig<TData> {
	columnId: ConfigStringLiteral<TData>;
	title: string;
	options?: FacetedFilterOption[];
	CustomFilterComponent?: React.ComponentType<{
		column: Column<TData, unknown>;
	}>;
}

type FacetedFilter<TData> =
	| ConfigStringLiteral<TData>
	| FacetedFilterConfig<TData>;

// Props for DataTableToolbar
interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	/**
	 * An array of filter configurations defining the faceted filters to be rendered in the toolbar.
	 * Each element can be either a string literal (a key of TData) for simple filters or a
	 * FacetedFilterConfig object for customized filters. The filters are displayed as dropdowns
	 * allowing users to select values to filter the table.
	 *
	 * @type {FacetedFilter<TData>[]}
	 * @example
	 * // Using string literals for automatic filter generation
	 * facetedFilters={["matchPercentage", "appliedJobs"]}
	 *
	 * // Using configuration objects with custom options
	 * facetedFilters={[
	 *   {
	 *     columnId: "matchPercentage",
	 *     title: "% match",
	 *     options: generatePercentageRangeOptions(0, 100, 25),
	 *   },
	 *   {
	 *     columnId: "appliedJobs",
	 *     title: "Applied Jobs",
	 *     options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }],
	 *   },
	 * ]}
	 * @remarks
	 * - String literals assume the column contains string or number values and generate options
	 *   dynamically via `getFacetedUniqueValues`.
	 * - FacetedFilterConfig objects allow overriding options or providing a customFilterComponent
	 *   (e.g., for range inputs).
	 * - The component relies on `getFacetedRowModel` and `getFacetedUniqueValues` being enabled
	 *   in the table instance for dynamic option generation.
	 * - A custom `filterFn` is recommended in the column definition, especially for custom options.
	 *   If no `filterFn` is provided, a warning will be logged.
	 */
	facetedFilters: FacetedFilter<TData>[];
	showSearchInput?: boolean;
	showDateRangeFilter?: boolean;
	/**
	 * An optional string literal specifying the key of the date column to use for global date range filtering.
	 * If provided, the toolbar will use this column; otherwise, it will prioritize columns explicitly
	 * marked with `meta: { isGlobalDateFilter: true }` in their `ColumnDef`. If no such column exists,
	 * it will fall back to the first column with values that can be parsed as valid dates or ISO strings.
	 * Must be a valid key of TData.
	 *
	 * @template TData - The type of the table data, ensuring the key is type-safe.
	 * @type {ConfigStringLiteral<TData>}
	 * @default undefined (prioritizes columns with `meta: { isGlobalDateFilter: true }`, then falls back to parseable dates)
	 * @remarks
	 * - The selected column must have a `filterFn` set to `dateRangeFilterFn` (or a compatible function)
	 *   to handle date range filtering logic.
	 * - The selected column must have `meta: { isGlobalDateFilter: true }` in its `ColumnDef` to explicitly
	 *   mark it as the column used for global date range filtering in the toolbar.
	 * - If the specified key is invalid, lacks date-like values, or does not meet these requirements,
	 *   warnings will be logged to guide setup.
	 */
	dateColumnIdForFilter?: ConfigStringLiteral<TData>;
}

/**
 * @deprecated Use {@link DataTableFiltersToolbar} instead.
 *
 * A reusable toolbar for filtering TanStack Table data.
 * @template TData - The type of the table data
 * @param {DataTableToolbarProps<TData>} props - Component props
 * @remarks
 * To enable all features (global filtering, faceted filtering, date range filtering), include these in `useReactTable`:
 * - `getCoreRowModel`: Basic row model
 * - `getFilteredRowModel`: For column and global filtering
 * - `getFacetedRowModel` and `getFacetedUniqueValues`: For faceted filtering
 * - Custom `filterFn` for date columns
 *
 * **Date Range Filtering Requirements**:
 * - The date column must have `meta: { isGlobalDateFilter: true }` in its `ColumnDef` to indicate it's used
 *   for global date range filtering in the toolbar.
 * - The date column must have a `filterFn` set to `dateRangeFilterFn` (or a compatible function).
 * - If `dateColumnIdForFilter` is provided, it takes precedence. Otherwise, the toolbar prioritizes
 *   columns with `meta: { isGlobalDateFilter: true }`, falling back to the first column with parseable date values.
 * - Warnings will be logged if the selected date column does not meet these requirements.
 *
 * Example:
 * ```typescript
 * const dateRangeFilterFn = (row, columnId, value: DateRange | undefined) => {
 *   const rowDate = new Date(row.getValue(columnId));
 *   if (!value || (!value.from && !value.to)) return true;
 *   const { from, to } = value;
 *   return (!from || rowDate >= from) && (!to || rowDate <= to);
 * };
 * const columns: ColumnDef<Task>[] = [
 *   { accessorKey: "title", header: "Title" },
 *   { accessorKey: "dueDate", header: "Due Date", filterFn: dateRangeFilterFn, meta: { isGlobalDateFilter: true } },
 * ];
 * const table = useReactTable({
 *   data,
 *   columns,
 *   getCoreRowModel: getCoreRowModel(),
 *   getFilteredRowModel: getFilteredRowModel(),
 *   getFacetedRowModel: getFacetedRowModel(),
 *   getFacetedUniqueValues: getFacetedUniqueValues(),
 * });
 * ```
 */
export function DataTableToolbar<TData>({
	table,
	facetedFilters,
	showSearchInput = true,
	showDateRangeFilter = true,
	dateColumnIdForFilter,
}: DataTableToolbarProps<TData>) {
	const isFiltered =
		table.getState().columnFilters.length > 0 ||
		!!table.getState().globalFilter;

	// Memoize the generateOptions function to avoid recalculating options unnecessarily
	const generateOptions = React.useCallback(
		(column: Column<TData, unknown>) => {
			const facets = column.getFacetedUniqueValues();
			return Array.from(facets.keys()).map((value) => ({
				label: String(value),
				value: String(value),
			}));
		},
		[]
	);

	// Memoize the renderFacetedFilter function to prevent re-creation on every render
	const renderFacetedFilter = React.useCallback(
		(config: FacetedFilter<TData>) => {
			const columnId =
				typeof config === "string" ? config : config.columnId;
			const column = table.getColumn(String(columnId));
			if (!column) return null;

			if (typeof config === "string") {
				// Check value type for simple config
				const sampleValue = table
					.getCoreRowModel()
					.rows[0]?.getValue(column.id);
				const valueType = typeof sampleValue;
				if (valueType !== "string" && valueType !== "number")
					return null; // Skip non-string/number without config
				return (
					<DataTableFacetedFilter
						column={column}
						title={String(config)}
						options={generateOptions(column)}
					/>
				);
			}

			// Handle config object
			const { title, options, CustomFilterComponent } = config;
			if (CustomFilterComponent)
				return <CustomFilterComponent column={column} />;

			return (
				<DataTableFacetedFilter
					column={column}
					title={title}
					options={options ?? generateOptions(column)}
				/>
			);
		},
		[table, generateOptions] // Deps: table (for column access), generateOptions
	);

	// Memoize the date column lookup with enhanced validation
	const dateColumn = React.useMemo(() => {
		if (!showDateRangeFilter) return undefined;

		let column: Column<TData, unknown> | undefined;

		// Step 1: Use the specified dateColumnIdForFilter if provided
		if (dateColumnIdForFilter) {
			column = table.getColumn(String(dateColumnIdForFilter));
			if (!column) {
				console.error(
					`No column found for 'dateColumnIdForFilter' (${String(
						dateColumnIdForFilter
					)}). Date range filtering requires a valid column.`
				);
				return undefined;
			}
		} else {
			// Step 2: Prioritize columns explicitly marked with meta: { isGlobalDateFilter: true }
			column = table.getAllColumns().find((col) => {
				return col.columnDef.meta?.isGlobalDateFilter === true;
			});

			// Step 3: Fallback to the first column with parseable date values if no meta match
			if (!column) {
				column = table.getAllColumns().find((col) => {
					const sampleValues = table
						.getCoreRowModel()
						.rows.slice(0, 5) // Sample first 5 rows to check
						.map((row) => row.getValue(col.id));
					return sampleValues.some(isDateValue);
				});
			}

			if (!column) {
				console.error(
					`No valid date column found. No column has meta: { isGlobalDateFilter: true }, and no column contains parseable date/ISO string values. Date range filtering requires this.`
				);
				return undefined;
			}
		}

		// Step 4: Validate the selected column for date range filtering requirements
		if (column) {
			// Check for meta: { isGlobalDateFilter: true }
			if (column.columnDef.meta?.isGlobalDateFilter !== true) {
				console.warn(
					`Column '${column.id}' used for date range filtering lacks meta: { isGlobalDateFilter: true } in its ColumnDef. This is required to explicitly mark the column for global date range filtering in the toolbar.`
				);
			}

			// Check for a compatible filterFn
			const filterFn = column.columnDef.filterFn;
			if (!filterFn) {
				console.warn(
					`Column '${column.id}' for date range filtering lacks a 'filterFn' in its ColumnDef. Date range filtering requires 'filterFn: dateRangeFilterFn' (or a compatible function) to work.`
				);
			} else if (filterFn !== dateRangeFilterFn) {
				console.info(
					`[DataTableToolbar] Column '${column.id}' uses a custom filter function for date range filtering. Ensure it is compatible with DateRange values (e.g., { from: Date, to: Date }).`
				);
			}
		}

		return column;
	}, [showDateRangeFilter, dateColumnIdForFilter, table]);

	// Memoize the reset handler to avoid re-creation
	const handleReset = React.useCallback(() => {
		table.resetColumnFilters();
		table.setGlobalFilter("");
	}, [table]); // Deps: table (for methods)

	return (
		<div className="w-full">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				{/* Global search input - always visible */}
				{showSearchInput && (
					<div className="w-full sm:max-w-64 relative">
						<div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
							<Search className="h-4 w-4 text-muted-foreground" />
						</div>
						<ToolbarInput table={table} />
					</div>
				)}

				{/* Reset button - aligned right on larger screens */}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={handleReset}
						className="h-8 px-2 lg:px-3 ml-auto sm:ml-0">
						Reset
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Filters section - wraps on smaller screens */}
			<div className="mt-2 flex flex-wrap gap-2 items-center">
				{/* Date range filter */}
				{showDateRangeFilter && dateColumn && (
					<div className="flex-grow sm:flex-grow-0">
						<DatePickerWithRange
							dateRange={
								dateColumn.getFilterValue() as
									| DateRange
									| undefined
							}
							onDateChange={(newDate) =>
								dateColumn.setFilterValue(newDate)
							}
							placeholder="Filter by date range"
						/>
					</div>
				)}

				{/* Faceted filters - wrap on smaller screens */}
				{facetedFilters.map((config, index) => (
					<div key={index} className="flex-grow sm:flex-grow-0">
						{renderFacetedFilter(config)}
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Filter function for ISO string dates.
 * To be used in the `ColumnDef` definition of the column to filter.
 * The column must have `meta: { isGlobalDateFilter: true }` to explicitly mark it as the date column
 * for global date range filtering in the toolbar.
 * @example
 * ```typescript
 * const columns: ColumnDef<Task>[] = [
 *   { accessorKey: "title", header: "Title" },
 *   { accessorKey: "dueDate", header: "Due Date", filterFn: dateRangeFilterFn, meta: { isGlobalDateFilter: true } },
 * ];
 * ```
 */
export const dateRangeFilterFn = <TData,>(
	row: Row<TData>,
	columnId: string,
	dateRange: DateRange | undefined
) => {
	const rowDate = new Date(row.getValue(columnId)); // Parse ISO string to Date
	if (!dateRange || (!dateRange.from && !dateRange.to)) return true; // No filter applied
	const { from, to } = dateRange;
	return (!from || rowDate >= from) && (!to || rowDate <= to); // Check range
};
