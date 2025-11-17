/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useSearchByURLParams } from "../../../../../../../hooks/use-search-by-url-params";
import {
	ListCardsGrid,
	ListContent,
	ListContentState,
	ListHeader,
	ListLoadingErrorMessage,
	ListLoadingIndicator,
	ListNoResultsMessage,
	ListPagination,
	SearchableJobsList,
	SearchInput,
} from "../../../components/searchable-jobs-list";
import { SearchResultCard } from "./components/search-result-card";
import { FiltersBlock } from "./filters-block";
import { useFetchSearchResults } from "./hook/use-fetch-search-results";

const PlayerJobSearch = () => {
	const { searchQuery, handleSearchChange } = useSearchByURLParams();

	const { queryOptions, pageIndex, pageSize, setPageIndex, setPageSize } =
		useFetchSearchResults();

	const query = useQuery(queryOptions);
	const filteredJobs = query.data?.data;

	const [showFilters, setShowFilters] = useState(false);

	const contentState = React.useMemo(
		() =>
			({
				isLoadingList: query.isLoading,
				initialLoadingError:
					!query.isSuccess && query.error ? query.error : null,
				hasNoResults: query.isSuccess && !filteredJobs?.length,
				isRefetchingFreshData:
					query.isPlaceholderData && query.isFetching,
			}) satisfies ListContentState,
		[
			filteredJobs?.length,
			query.error,
			query.isFetching,
			query.isLoading,
			query.isPlaceholderData,
			query.isSuccess,
		],
	);

	return (
		<SearchableJobsList>
			<ListHeader className="block space-y-4">
				<SearchInput
					value={searchQuery}
					onChange={(e) => {
						const value = e.target.value;
						handleSearchChange(value);
					}}
					placeholder="Search jobs"
				/>

				<div className="flex items-center justify-between gap-2 border-b p-4">
					<div className="font-medium">Search Results...</div>
					<Button
						type="button" //
						variant={"secondary"}
						onClick={() => setShowFilters((prev) => !prev)}>
						{showFilters ? "Hide Filters" : "Show Filters"}
					</Button>
				</div>
				{showFilters && (
					<div className="border-b p-4">
						<FiltersBlock />
					</div>
				)}
			</ListHeader>

			<ListContent contentState={contentState}>
				<ListLoadingIndicator>
					Loading jobs... <LoadingIndicator />
				</ListLoadingIndicator>
				<ListNoResultsMessage
					title="No jobs found"
					description="Try adjusting your filters or search terms to see more results."
				/>
				<ListLoadingErrorMessage>
					{(error) =>
						`Error loading jobs: ${getApiErrorMessage(error)}`
					}
				</ListLoadingErrorMessage>

				<ListCardsGrid>
					{filteredJobs?.map((job) => {
						return <SearchResultCard key={job.id} job={job} />;
					})}
				</ListCardsGrid>
			</ListContent>

			<ListPagination
				onPageIndexChange={setPageIndex}
				onPageSizeChange={setPageSize}
				pageIndex={pageIndex}
				pageSize={pageSize}
				totalItems={query.data?.meta.total ?? 0}
			/>
		</SearchableJobsList>
	);
};

export default PlayerJobSearch;
