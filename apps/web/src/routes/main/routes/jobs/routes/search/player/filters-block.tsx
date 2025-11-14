/** @format */

import SearchFilterDropdown, {
	clubListFilters,
	clubTypeFilters,
	DropdownFiltersData,
	RegionFilters,
	workTypeFilters,
} from "@/components/common/search-filters-dropdown";
import {
	TreeFilterDropdown,
	TreeFiltersDropdownData,
} from "@/components/common/search-filters-dropdown/tree-filter-dropdown";
import { COMPANY_INDUSTRY_TREE_FILTERS } from "@/data/search-filters-dropdown";
import { useFilterByUrlParams } from "@/hooks/use-filter-by-url-params-nuqs";
import { createFilterParsers } from "@/lib/helper-functions/filters";
import { cn } from "@/lib/utils";
import { type FC } from "react";
import { JobSearchFilters } from "../../../query-factory";

// Define the filter map with keys that match the expected filter keys
export const filtersMap = {
	clubTypes: clubTypeFilters,
	clubs: clubListFilters,
	regions: RegionFilters,
	industry: COMPANY_INDUSTRY_TREE_FILTERS,
	workTypes: workTypeFilters,
} as const satisfies Record<
	keyof JobSearchFilters,
	DropdownFiltersData | TreeFiltersDropdownData
>;

const filterKeys = Object.keys(filtersMap) as (keyof JobSearchFilters)[];

export const filterParsers = createFilterParsers(
	filterKeys.reduce(
		(acc, key) => {
			acc[key] = [];
			return acc;
		},
		{} as Record<keyof JobSearchFilters, string[]>
	)
);

interface Props {
	className?: string;
}

export const FiltersBlock: FC<Props> = ({ className }) => {
	const { filters, updateFilter } = useFilterByUrlParams({
		parsers: filterParsers,
	});

	return (
		<div
			className={cn(
				"grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6 2xl:grid-cols-6",
				className
			)}>
			{/* Map over the keys obtained from your filtersMap */}
			{filterKeys.map((filterKey) =>
				filterKey === "industry" ? (
					<TreeFilterDropdown
						key={filterKey}
						filterValues={filtersMap[filterKey]}
						selectedOptions={filters[filterKey] || []}
						onOptionToggle={(option) => {
							updateFilter({
								filterKey,
								option,
								mode: "toggle",
							});
						}}
					/>
				) : (
					<SearchFilterDropdown
						key={filterKey}
						filterValues={filtersMap[filterKey]}
						selectedOptions={filters[filterKey] || []}
						onOptionToggle={(option) => {
							updateFilter({
								filterKey,
								option,
								mode: "toggle",
							});
						}}
					/>
				)
			)}
		</div>
	);
};
