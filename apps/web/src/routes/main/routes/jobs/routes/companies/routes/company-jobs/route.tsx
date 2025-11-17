/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { href, useLocation, useNavigate } from "react-router";
import { JobCard } from "../../../../components/job-card";
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
} from "../../../../components/searchable-jobs-list";
import { useJobsByCompanyQueryConfig } from "./hooks/use-jobs-by-company-query-config";
import { useToggleJobBookmark } from "./hooks/use-toggle-job-bookmark";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: ["player", "supporter"],
	}).redirect;
};

export default function JobsByCompany() {
	const { queryOptions, pagination, search, setSearch } =
		useJobsByCompanyQueryConfig();

	const query = useQuery(queryOptions);

	const { updateFromServerMeta } = pagination;
	React.useEffect(() => {
		updateFromServerMeta(query.data?.meta);
	}, [query.data?.meta, updateFromServerMeta]);

	const jobs = query.data?.data;

	const contentState = React.useMemo(
		() =>
			({
				isLoadingList: query.isLoading,
				initialLoadingError:
					!query.isSuccess && query.error ? query.error : null,
				hasNoResults: query.isSuccess && !jobs?.length,
				isRefetchingFreshData:
					query.isPlaceholderData && query.isFetching,
			}) satisfies ListContentState,
		[
			jobs?.length,
			query.error,
			query.isFetching,
			query.isLoading,
			query.isPlaceholderData,
			query.isSuccess,
		],
	);

	const navigate = useNavigate();

	const { mutate: toggleBookmark } = useToggleJobBookmark();

	const location = useLocation();

	return (
		<SearchableJobsList>
			<ListHeader>
				<SearchInput
					value={search}
					onChange={(e) => {
						const value = e.target.value;
						void setSearch(value ? value : null);
					}}
					placeholder="Search jobs"
				/>
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
					{query.data?.data.map((job) => {
						return (
							<JobCard
								key={job.id}
								jobTitle={job.title}
								jobLocation={job.location}
								companyLogo={getFileNameUrl(
									query.data.company.avatar,
								)}
								isJobBookmarked={job.isBookmarked}
								onToggleJobBookmark={() => toggleBookmark(job)}
								onApplyToJob={() => {
									const pathToApply = href("/jobs/:id", {
										id: job.id,
									});
									void navigate(pathToApply, {
										state: {
											crumbs: [
												{
													to: location,
													state: location.state, // to preserve breadcrumbs state when returning here through it
													label: `Jobs from ${query.data.company.name}`,
												},
												{
													label: `Apply to ${job.title}`,
												},
											],
										} satisfies CrumbsLocationState,
									});
								}}
							/>
						);
					})}
				</ListCardsGrid>
			</ListContent>

			<ListPagination
				onPageIndexChange={pagination.setPageIndex}
				onPageSizeChange={pagination.setPageSize}
				pageIndex={pagination.pageIndex}
				pageSize={pagination.pageSize}
				totalItems={query.data?.meta.total ?? 0}
			/>
		</SearchableJobsList>
	);
}
