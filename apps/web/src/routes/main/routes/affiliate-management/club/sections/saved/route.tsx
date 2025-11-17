/** @format */
import { LinkButton } from "@/components/common/link-btn";
import LoadingIndicator from "@/components/common/loading-indicator";
import {
	FilterControls,
	FiltersBlock,
	FiltersResetButton,
	FiltersVisibilityButton,
	Header,
	ListCard,
	ListCardActions,
	ListCardsGrid,
	ListContent,
	ListContentStateContextType,
	ListLoadingErrorMessage,
	ListLoadingIndicator,
	ListNoResultsMessage,
	ListPagination,
	ListProfileCard,
	SearchableUserCardsList,
} from "@/components/common/searchable-user-cards-list";
import { Button } from "@/components/ui/button";
import CompanyDataCard from "@/components/user-dynamic-cards/partner";
import { PlayerDynamicCard } from "@/components/user-dynamic-cards/player-card";
import { useFilterByUrlParams } from "@/hooks/use-filter-by-url-params-nuqs";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { usePagination } from "@/hooks/use-pagination";
import apiAxiosInstance from "@/lib/axios-instance";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { cn } from "@/lib/utils";
import { ClubReferredUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { useClubProfile } from "@/routes/main/routes/profile/club/use-fetch-profile";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookmarkX } from "lucide-react";
import React from "react";
import { href } from "react-router";
import { toast } from "sonner";
import {
	filterParsers,
	SavedAffiliatesFiltersBlock,
} from "./components/filters-block";
import {
	SavedAffiliateFilters,
	SavedAffiliatesApiResponseData,
	savedAffliatesQueries,
} from "./query-factory";

const useSavedAffiliatesQueryConfig = () => {
	const pagination = usePagination();

	const { pageSize, pageIndex } = pagination;

	const { filters, clearAllFilters } = useFilterByUrlParams({
		parsers: filterParsers,
	});

	const isListFiltered = React.useMemo(() => {
		const keys = Object.keys(filters);
		return keys.some((key) => filters[key as keyof typeof filters].length);
	}, [filters]);

	const queryOptions = React.useMemo(
		() => ({
			...savedAffliatesQueries.affiliates({
				page: pageIndex + 1,
				limit: pageSize,
				affiliateTypes:
					filters.affiliateTypes as SavedAffiliateFilters["affiliateTypes"],
			}),
			placeholderData: keepPreviousData,
		}),
		[filters.affiliateTypes, pageIndex, pageSize],
	);

	return { pagination, queryOptions, isListFiltered, clearAllFilters };
};

interface UnsaveAffiliateMutationParams {
	userId: string;
	role: ClubReferredUserType;
}
const useUnsaveAffiliate = () => {
	const { queryOptions } = useSavedAffiliatesQueryConfig();
	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		updater: (old, affiliate) => {
			if (!old) return old;
			return {
				...old,
				data: old.data.filter((aff) => aff.userId !== affiliate.userId),
			};
		},
		mutationFn: async (affiliate: SavedAffiliatesApiResponseData) => {
			await apiAxiosInstance.post("/club/save", {
				userId: affiliate.userId,
				role: affiliate.userType,
			} satisfies UnsaveAffiliateMutationParams);
		},
		onSuccess: (_, affiliate) => {
			toast.success(`Successfully unsaved affiliae - ${affiliate.name}.`);
		},
		onError: (error, affiliate) => {
			toast.error(`Couldn't unsave affiliate - ${affiliate.name}`, {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface UnsaveButtonProps {
	affiliate: SavedAffiliatesApiResponseData;
}
const UnsaveButton: React.FC<UnsaveButtonProps> = ({ affiliate }) => {
	const { mutate, isPending } = useUnsaveAffiliate();

	return (
		<Button
			onClick={() => mutate(affiliate)}
			disabled={isPending}
			variant={"outline"}
			size={"icon"}
			title="Unsave affiliate">
			<BookmarkX className={cn("fill-blue- stroke-blue-700")} />
		</Button>
	);
};

interface ProfileLinkButtonProps {
	userName: string;
	userType: ClubReferredUserType;
	userId: string;
}

const ProfileLinkButton: React.FC<ProfileLinkButtonProps> = ({
	userType,
	userId,
	userName,
}) => {
	const profileLink = href("/:userType/:id", {
		userType: userType,
		id: userId,
	});
	return (
		<LinkButton
			prefetch="intent"
			to={profileLink}
			state={
				{
					crumbs: [
						{
							path: href("/affiliate-management/saved"),
							label: "Saved affiliates",
						},
						{
							path: profileLink,
							label: userName,
						},
					],
				} satisfies CrumbsLocationState
			}>
			Profile
		</LinkButton>
	);
};

const SavedAffiliatesRoute: React.FC = () => {
	const { pagination, queryOptions, isListFiltered, clearAllFilters } =
		useSavedAffiliatesQueryConfig();
	const {
		setPageIndex,
		setPageSize,
		pageSize,
		pageIndex,
		updateFromServerMeta,
	} = pagination;

	const { data, isLoading, isFetching, isPlaceholderData, isSuccess, error } =
		useQuery(queryOptions);

	React.useEffect(() => {
		updateFromServerMeta(data?.meta);
	}, [data?.meta, updateFromServerMeta]);

	const affiliates = data?.data;

	const {
		data: clubProfile,
		isLoading: isLoadingClub,
		error: clubError,
	} = useClubProfile();

	const contentState = React.useMemo(
		() =>
			({
				isLoadingList: isLoading,
				isRefetchingFreshData: isPlaceholderData && isFetching,
				hasNoResults: isSuccess && !affiliates?.length,
				initialLoadingError: !isSuccess && error ? (error instanceof Error ? error : new Error(String(error))) : null,
			}) satisfies ListContentStateContextType,
		[
			isLoading,
			isPlaceholderData,
			isFetching,
			isSuccess,
			affiliates?.length,
			error,
		],
	);

	return (
		<SearchableUserCardsList>
			<Header>
				<FilterControls
					onClearFilters={clearAllFilters}
					isFiltered={isListFiltered}>
					<FiltersVisibilityButton>
						{(isFiltersShown) =>
							isFiltersShown ? "Hide Filters" : "Show Filters"
						}
					</FiltersVisibilityButton>
					<FiltersBlock>
						<SavedAffiliatesFiltersBlock />
					</FiltersBlock>

					<FiltersResetButton>Clear filters</FiltersResetButton>
				</FilterControls>
			</Header>

			<ListContent contentState={contentState}>
				<ListLoadingIndicator>
					Loading saved affiliates... <LoadingIndicator />
				</ListLoadingIndicator>
				<ListNoResultsMessage
					title="No saved affiliates found"
					description="Try adjusting your filters to see more results."
				/>
				<ListLoadingErrorMessage>
					{(error) =>
						`Error loading affiliates: ${getApiErrorMessage(error)}`
					}
				</ListLoadingErrorMessage>
				<ListCardsGrid>
					{affiliates?.map((affiliate) => (
						<ListCard key={affiliate.userId}>
							{isLoadingClub ? (
								<>
									Loading your club&apos;s data{" "}
									<LoadingIndicator />
								</>
							) : clubProfile ? (
								affiliate.userType === "company" ? (
									<ListProfileCard>
										<CompanyDataCard
											companyData={{
												...affiliate,
												id: affiliate.userId,
												club: clubProfile,
											}}
										/>
									</ListProfileCard>
								) : (
									<ListProfileCard>
										<PlayerDynamicCard
											{...affiliate}
											id={affiliate.userId}
											club={clubProfile}
										/>
									</ListProfileCard>
								)
							) : (
								<p>
									Error loading club data{" "}
									{getApiErrorMessage(clubError)}
								</p>
							)}
							<ListCardActions>
								<UnsaveButton affiliate={affiliate} />
								<ProfileLinkButton
									userType={affiliate.userType}
									userName={affiliate.name}
									userId={affiliate.id}
								/>
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

export default SavedAffiliatesRoute;
