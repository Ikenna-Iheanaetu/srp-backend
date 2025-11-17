/** @format */
import LoadingIndicator from "@/components/common/loading-indicator";
import {
	FilterControls,
	FiltersBlock,
	FiltersResetButton,
	FiltersVisibilityButton,
	ListCard,
	ListCardActions,
	ListCardsGrid,
	ListContent,
	ListContentStateContextType,
	ListHeader,
	ListLoadingErrorMessage,
	ListLoadingIndicator,
	ListNoResultsMessage,
	ListPagination,
	ListProfileCard,
	SearchableUserCardsList,
} from "@/components/common/searchable-user-cards-list";
import { usePagination } from "@/hooks/use-pagination";
import { getErrorMessage } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import React, { type FC, useEffect, useMemo } from "react";
import { CandidateProfileCard } from "./components/candidate-profile-card";
import {
	RecruitingSearchFiltersBlock,
	SearchCandidateFilters,
	useFilterSearchParams,
} from "./components/filters-block";
import { ProfileLinkButton } from "./components/profile-link-button";
import { ShortlistButton } from "./components/shortlist-controls";
import { searchQueries } from "./query-factory";

const RecruitingSearchRoute: FC = () => {
	const {
		setPageIndex,
		setPageSize,
		pageSize,
		pageIndex,
		updateFromServerMeta,
	} = usePagination();

	const { filters, setFilters } = useFilterSearchParams();

	// Query with filters applied
	const { data, isLoading, isFetching, isPlaceholderData, isSuccess, error } =
		useQuery({
			...searchQueries.candidatesSearch({
				page: pageIndex + 1,
				limit: pageSize,
				...filters,
			}),
			placeholderData: keepPreviousData,
		});

	useEffect(() => {
		updateFromServerMeta(data?.meta);
	}, [data?.meta, updateFromServerMeta]);

	const players = data?.data;

	const contentState = useMemo(
		() =>
			({
				isLoadingList: isLoading,
				isRefetchingFreshData: isPlaceholderData && isFetching,
				hasNoResults: isSuccess && !players?.length,
				initialLoadingError: !isSuccess && error ? error : null,
			}) satisfies ListContentStateContextType,
		[isLoading, isPlaceholderData, isFetching, isSuccess, players, error],
	);

	const isListFiltered = React.useMemo(() => {
		const keys = Object.keys(filters);
		return keys.some((key) => filters[key as keyof typeof filters].length);
	}, [filters]);

	return (
		<SearchableUserCardsList>
			<ListHeader>
				<FilterControls
					onClearFilters={() => {
						void setFilters({
							candidates: [],
							workTypes: [],
							clubTypes: [],
							clubs: [],
							regions: [],
							industry: [],
						} satisfies Required<SearchCandidateFilters>);
					}}
					isFiltered={isListFiltered}>
					<FiltersVisibilityButton>
						{(isFiltersShown) =>
							isFiltersShown ? "Hide Filters" : "Show Filters"
						}
					</FiltersVisibilityButton>
					<FiltersBlock>
						<RecruitingSearchFiltersBlock />
					</FiltersBlock>

					<FiltersResetButton>Clear filters</FiltersResetButton>
				</FilterControls>
			</ListHeader>

			<ListContent contentState={contentState}>
				<ListLoadingIndicator>
					Loading candidates... <LoadingIndicator />
				</ListLoadingIndicator>
				<ListNoResultsMessage
					title="No candidates found"
					description="Try adjusting your filters or search terms to see more results."
				/>
				<ListLoadingErrorMessage>
					{(error) =>
						`Error loading candidates: ${getErrorMessage(error)}`
					}
				</ListLoadingErrorMessage>
				<ListCardsGrid>
					{players?.map((candidate) => (
						<ListCard key={candidate.id}>
							<ListProfileCard>
								<CandidateProfileCard data={candidate} />
							</ListProfileCard>
							<ListCardActions>
								<ShortlistButton candidate={candidate} />
								<ProfileLinkButton candidate={candidate} />
							</ListCardActions>
						</ListCard>
					))}
				</ListCardsGrid>
			</ListContent>

			<ListPagination
				onPageIndexChange={setPageIndex}
				onPageSizeChange={setPageSize}
				pageIndex={pageIndex}
				pageSize={pageSize}
				totalItems={data?.meta.total ?? 0}
			/>
		</SearchableUserCardsList>
	);
};

export default RecruitingSearchRoute;
