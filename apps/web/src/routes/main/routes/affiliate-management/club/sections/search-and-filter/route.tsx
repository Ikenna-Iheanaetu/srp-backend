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
	SearchInput,
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
import { Bookmark } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import React from "react";
import { href } from "react-router";
import { toast } from "sonner";
import {
	AffiliatesFiltersBlock,
	filterParsers,
} from "./components/filters-block";
import {
	AffiliateFilters,
	AffiliatesApiResponseData,
	affliatesQueries,
} from "./query-factory";

const useAffiliatesQueryConfig = () => {
	const pagination = usePagination();

	const { pageSize, pageIndex } = pagination;

	const { filters, clearAllFilters } = useFilterByUrlParams({
		parsers: filterParsers,
	});

	const isListFiltered = React.useMemo(() => {
		const keys = Object.keys(filters);
		return keys.some((key) => filters[key as keyof typeof filters].length);
	}, [filters]);

	const [search, setSearch] = useQueryState(
		"search",
		parseAsString.withDefault(""),
	);

	const queryOptions = React.useMemo(
		() => ({
			...affliatesQueries.affiliates({
				page: pageIndex + 1,
				limit: pageSize,
				search,
				affiliateTypes:
					filters.affiliateTypes as AffiliateFilters["affiliateTypes"],
			}),
			placeholderData: keepPreviousData,
		}),
		[filters.affiliateTypes, pageIndex, pageSize, search],
	);

	return {
		pagination,
		queryOptions,
		search,
		setSearch,
		clearAllFilters,
		isListFiltered,
	};
};

interface ToggleSaveAffiliateMutationParams {
	userId: string;
	role: ClubReferredUserType;
}
const useToggleSaveAffiliate = () => {
	const { queryOptions } = useAffiliatesQueryConfig();
	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		updater: (old, affiliate) => {
			if (!old) return old;
			return {
				...old,
				data: old.data.map((aff) => ({
					...aff,
					isSaved:
						aff.userData.userId === affiliate.userData.userId
							? !aff.isSaved
							: aff.isSaved,
				})),
			};
		},
		mutationFn: async (affiliate: AffiliatesApiResponseData) => {
			await apiAxiosInstance.post("/club/save", {
				userId: affiliate.userData.userId,
				role: affiliate.userData.userType,
			} satisfies ToggleSaveAffiliateMutationParams);
		},
		onSuccess: (_, affiliate) => {
			toast.success(
				`Successfully ${
					affiliate.isSaved ? "unsaved" : "saved"
				} affiliate - ${affiliate.userData.name}.`,
			);
		},
		onError: (error, affiliate) => {
			toast.error(
				`Couldn't ${
					affiliate.isSaved ? "unsave" : "save"
				} affiliate - ${affiliate.userData.name}`,
				{
					description: getApiErrorMessage(error),
				},
			);
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface ToggleSaveButtonProps {
	affiliate: AffiliatesApiResponseData;
}
const ToggleSaveButton: React.FC<ToggleSaveButtonProps> = ({ affiliate }) => {
	const { mutate, isPending } = useToggleSaveAffiliate();

	return (
		<Button
			onClick={() => mutate(affiliate)}
			disabled={isPending}
			size={"icon"}
			title={affiliate.isSaved ? "Unsave affiliate" : "Save affiliate"}
			className="button">
			<Bookmark
				className={cn(
					"stroke-blue-700",
					affiliate.isSaved && "fill-blue-700",
				)}
			/>
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
			variant={"outline"}
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

const AffiliatesRoute: React.FC = () => {
	const {
		pagination,
		queryOptions,
		search,
		setSearch,
		clearAllFilters,
		isListFiltered,
	} = useAffiliatesQueryConfig();
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
				initialLoadingError: !isSuccess && error ? error : null,
			}) satisfies ListContentStateContextType,
		[
			affiliates?.length,
			error,
			isFetching,
			isLoading,
			isPlaceholderData,
			isSuccess,
		],
	);

	return (
		<SearchableUserCardsList>
			<FilterControls
				onClearFilters={clearAllFilters}
				isFiltered={isListFiltered}>
				<Header>
					<SearchInput
						placeholder="Search affiliates..."
						value={search}
						onChange={(e) => void setSearch(e.target.value)}
					/>
					<FiltersVisibilityButton>
						{(isFiltersShown) =>
							isFiltersShown ? "Hide Filters" : "Show Filters"
						}
					</FiltersVisibilityButton>
					<FiltersBlock>
						<AffiliatesFiltersBlock />
					</FiltersBlock>

					<FiltersResetButton>Clear filters</FiltersResetButton>
				</Header>
			</FilterControls>

			<ListContent contentState={contentState}>
				<ListLoadingIndicator>
					Loading affiliates... <LoadingIndicator />
				</ListLoadingIndicator>
				<ListNoResultsMessage
					title="No affiliates found"
					description="Try adjusting your filters or search terms to see more results."
				/>
				<ListLoadingErrorMessage>
					{(error) =>
						`Error loading affiliates: ${getApiErrorMessage(error)}`
					}
				</ListLoadingErrorMessage>
				<ListCardsGrid>
					{affiliates?.map((affiliate) => {
						if (!affiliate.userData) {
							console.warn(
								"Affiliate userData is missing:",
								affiliate,
							);
							return null;
						}

						return (
							<ListCard key={affiliate.id}>
								{isLoadingClub ? (
									<>
										Loading your club&apos;s data{" "}
										<LoadingIndicator />
									</>
								) : clubProfile ? (
									affiliate.userData.userType ===
									"company" ? (
										<ListProfileCard>
											<CompanyDataCard
												companyData={{
													...affiliate.userData,
													club: clubProfile,
												}}
											/>
										</ListProfileCard>
									) : (
										<ListProfileCard>
											<PlayerDynamicCard
												{...affiliate.userData}
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
									<ProfileLinkButton
										userType={affiliate.userData.userType}
										userName={affiliate.userData.name}
										userId={affiliate.userData.id}
									/>
									<ToggleSaveButton affiliate={affiliate} />
								</ListCardActions>
							</ListCard>
						);
					})}
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

export default AffiliatesRoute;
