/** @format */

import { FacetedFilterOption } from "@/components/common/data-table/faceted-filter";
import { Row } from "@tanstack/react-table";

export const matchPercentFilterOptions = [
	{ label: "0-25%", value: "0-25" },
	{ label: "25-50%", value: "25-50" },
	{ label: "50-75%", value: "50-75" },
	{ label: "75-100%", value: "75-100" },
] as const satisfies FacetedFilterOption[];

export const matchPercentFilterFn = <TData>(
	row: Row<TData>,
	columnId: string,
	filterValue:
		| (typeof matchPercentFilterOptions)[number]["value"][]
		| undefined,
) => {
	const cellValue = row.getValue(columnId); // Get raw value (e.g., 89)
	if (!filterValue || filterValue.length === 0) return true; // No filter applied
	if (cellValue == null) return false; // Skip rows with null/undefined values

	const numericValue = Number(cellValue); // Convert to number

	if (isNaN(numericValue)) return false; // Skip invalid (non-numeric) values

	return filterValue.some((option) => {
		const [min, max] = option.split("-").map(Number); // Parse range like "0-25"

		// Validate parsed range
		if (!(min && max) || isNaN(min) || isNaN(max)) {
			console.warn(
				"[matchPercentFilterFn] Invalid range in option:",
				option,
			);
			return false;
		}

		return numericValue >= min && numericValue <= max;
	});
};
