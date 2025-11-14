/** @format */

import SearchFilterDropdown, {
	type DropdownFiltersData,
} from "@/components/common/search-filters-dropdown";
import { useFilterByUrlParams } from "@/hooks/use-filter-by-url-params-nuqs";
import { createFilterParsers } from "@/lib/helper-functions/filters";

const candidatesFilterConfig = {
	labels: {
		hanging: "Affiliates",
		button: "Affiliate Type",
		menu: "Select types",
	},
	options: [
		{ value: "player", label: "Player" },
		{ value: "supporter", label: "Supporter" },
		{ value: "company", label: "Company" },
	],
} as const satisfies DropdownFiltersData;

export const filtersMap = {
	affiliateTypes: candidatesFilterConfig,
} as const satisfies Record<string, DropdownFiltersData>;

const filterKeys = Object.keys(filtersMap) as (keyof typeof filtersMap)[];

export const filterParsers = createFilterParsers(
	filterKeys.reduce((acc, key) => {
		acc[key] = [];
		return acc;
	}, {} as Record<keyof typeof filtersMap, string[]>)
);

export const AffiliatesFiltersBlock: React.FC = () => {
	const { filters, updateFilter } = useFilterByUrlParams({
		parsers: filterParsers,
	});

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
			{filterKeys.map((filterKey) => {
				return (
					<SearchFilterDropdown
						key={filterKey}
						filterValues={filtersMap[filterKey]}
						selectedOptions={filters[filterKey] || []}
						onOptionToggle={(option) =>
							updateFilter({
								filterKey,
								option,
								mode: "toggle",
							})
						}
					/>
				);
			})}
		</div>
	);
};
