/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import {
	candidatesFilters,
	clubTypeFilters,
	type DropdownFiltersData,
	RegionFilters,
	workTypeFilters,
} from "@/components/common/search-filters-dropdown";
import {
	SearchFilterContentLabel,
	SearchFilterDropdown,
	SearchFilterItem,
	SearchFilterItemsGroup,
	SearchFilterMenuButton,
	SearchFilterMenuContent,
} from "@/components/common/search-filters-dropdown/new";
import {
	TreeFilterDropdown,
	TreeFiltersDropdownData,
} from "@/components/common/search-filters-dropdown/tree-filter-dropdown";
import { Input } from "@/components/ui/input";
import { PLAYER_INDUSTRY_TREE_FILTERS } from "@/data/search-filters-dropdown";
import { cn } from "@/lib/utils";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsString, useQueryStates, Values } from "nuqs";
import type { FC } from "react";
import React from "react";
import { searchQueries } from "../query-factory";

const filterSearchParsers = {
	regions: parseAsArrayOf(parseAsString).withDefault([]),
	candidates: parseAsArrayOf(parseAsString).withDefault([]),
	workTypes: parseAsArrayOf(parseAsString).withDefault([]),
	clubTypes: parseAsArrayOf(parseAsString).withDefault([]),
	clubs: parseAsArrayOf(parseAsString).withDefault([]),
	industry: parseAsArrayOf(parseAsString).withDefault([]),
};

export type SearchCandidateFilters = Values<typeof filterSearchParsers>;

export const useFilterSearchParams = () => {
	const [filters, setFilters] = useQueryStates(filterSearchParsers);

	return {
		filters,
		setFilters,
	};
};

const ClubListFilters = () => {
	const [search, setSearch] = React.useState("");
	const {
		data,
		hasNextPage,
		fetchNextPage,
		isLoading,
		isFetchingNextPage,
		isFetching,
		isPlaceholderData,
	} = useInfiniteQuery({
		...searchQueries.clubsList({ search }),
		placeholderData: keepPreviousData,
	});

	const fetchedClubs = data?.pages.flatMap((page) => page.data);

	const THRESHOLD_FROM_END = 10;
	const thresholdIndex = fetchedClubs
		? Math.max(0, fetchedClubs.length - THRESHOLD_FROM_END)
		: 0;
	const thresholdRef = (node: HTMLDivElement) => {
		const thresholdObserver = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting && hasNextPage && !isFetching) {
					void fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);

		thresholdObserver.observe(node);

		return () => {
			thresholdObserver.disconnect();
		};
	};

	const { filters, setFilters } = useFilterSearchParams();
	const FILTER_KEY = "clubs";
	const selectedClubIds = filters[FILTER_KEY];

	return (
		<SearchFilterDropdown
			selectedOptions={selectedClubIds}
			setSelectedOptions={(options) =>
				void setFilters((prevFilters) => ({
					...prevFilters,
					[FILTER_KEY]: options,
				}))
			}>
			<SearchFilterMenuButton
				labels={{
					hanging: "Clubs",
					button: "Clubs List",
				}}
			/>

			<SearchFilterMenuContent>
				<SearchFilterContentLabel>Clubs List</SearchFilterContentLabel>

				<div className="relative space-y-4 tw-scrollbar">
					<div
						className="sticky top-0"
						onKeyDown={(e) => {
							// to avoid filter item from stealing focus from input
							e.stopPropagation();
						}}>
						<Input
							placeholder="Search club"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
							}}
							className="border-none focus-visible:ring-0"
						/>
					</div>

					<SearchFilterItemsGroup
						className={cn(
							"flex-1",
							isPlaceholderData && isFetching && "animate-pulse",
						)}>
						<div className="text-center">
							{isLoading ? (
								<>
									Fetching clubs <LoadingIndicator />
								</>
							) : (
								!fetchedClubs?.length && "No clubs found"
							)}
						</div>

						{fetchedClubs?.map(({ id, name }, index) => (
							<SearchFilterItem
								key={id}
								ref={(node) => {
									let thresholdCleanup = () => {};
									if (index === thresholdIndex && node) {
										thresholdCleanup = thresholdRef(node);
									}

									return () => {
										thresholdCleanup();
									};
								}}
								option={id}
								label={name}
							/>
						))}

						{isFetchingNextPage && <LoadingIndicator />}
					</SearchFilterItemsGroup>
				</div>
			</SearchFilterMenuContent>
		</SearchFilterDropdown>
	);
};

type MappedFilterKey = SafeExclude<keyof SearchCandidateFilters, "clubs">;

// TODO: Refine this implementation a bit.
export const filtersMap = {
	regions: RegionFilters,
	candidates: candidatesFilters,
	workTypes: workTypeFilters,
	clubTypes: clubTypeFilters,
	industry: PLAYER_INDUSTRY_TREE_FILTERS,
} as const satisfies Record<
	MappedFilterKey,
	DropdownFiltersData | TreeFiltersDropdownData
>;

const filterKeys = Object.keys(filtersMap) as MappedFilterKey[];

export const RecruitingSearchFiltersBlock: FC = () => {
	const { filters, setFilters } = useFilterSearchParams();

	return (
		<div className="grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-5">
			{filterKeys.map((filterKey) => {
				return filterKey === "industry" ? (
					<TreeFilterDropdown
						key={filterKey}
						filterValues={filtersMap[filterKey]}
						selectedOptions={filters[filterKey]}
						onOptionToggle={(option) => {
							void setFilters((prevFilters) => {
								const currentOptions = prevFilters[filterKey];
								if (currentOptions.includes(option)) {
									return {
										...prevFilters,
										[filterKey]: currentOptions.filter(
											(op) => op !== option,
										),
									};
								}
								return {
									...prevFilters,
									[filterKey]: [...currentOptions, option],
								};
							});
						}}
					/>
				) : (
					<SearchFilterDropdown
						key={filterKey}
						selectedOptions={filters[filterKey]}
						setSelectedOptions={(options) =>
							void setFilters((prevFilters) => ({
								...prevFilters,
								[filterKey]: options,
							}))
						}>
						<SearchFilterMenuButton
							labels={filtersMap[filterKey].labels}
						/>

						<SearchFilterMenuContent>
							<SearchFilterContentLabel>
								{filtersMap[filterKey].labels.menu}
							</SearchFilterContentLabel>

							<SearchFilterItemsGroup>
								{filtersMap[filterKey].options.map((option) => (
									<SearchFilterItem
										key={option.value}
										label={option.label}
										option={option.value}
									/>
								))}
							</SearchFilterItemsGroup>
						</SearchFilterMenuContent>
					</SearchFilterDropdown>
				);
			})}

			<ClubListFilters />
		</div>
	);
};
