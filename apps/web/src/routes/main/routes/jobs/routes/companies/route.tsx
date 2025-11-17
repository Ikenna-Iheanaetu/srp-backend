/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import {
	ListCard,
	ListCardActions,
	ListCardsGrid,
	ListContent,
	ListContentState,
	ListHeader,
	ListLoadingErrorMessage,
	ListLoadingIndicator,
	ListNoResultsMessage,
	ListPagination,
	ListProfileCard,
	SearchableUserCardsList,
	SearchInput,
} from "@/components/common/searchable-user-cards-list";
import CompanyDataCard from "@/components/user-dynamic-cards/partner";
import { usePagination } from "@/hooks/use-pagination";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { getErrorMessage } from "@/lib/utils";
import {
	Crumbs,
	CrumbsLocationState,
} from "@/routes/main/components/app-header/bread-crumb-navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import React from "react";
import { href, To, useLocation, useNavigate } from "react-router";
import { serializeNewChatSearchParams } from "../../../messages/routes/new/search-params";
import { JobsLinkButton } from "./components/jobs-link-button";
import { ProfileLinkButton } from "./components/profile-link-button";
import { companiesSearchQueries, CompanyToView } from "./query-factory";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: ["player", "supporter"],
	});
};

const useChatNavigatePropsForEntitryView = (data: CompanyToView) => {
	const currentLocation = useLocation();

	const navigateTo: To = React.useMemo(() => {
		if (data.chatId) {
			return href("/messages/:id", {
				id: data.chatId,
			});
		}
		return {
			pathname: href("/messages/new"),
			search: serializeNewChatSearchParams({
				recipientId: data.userId,
			}),
		};
	}, [data.chatId, data.userId]);

	const stateForTarget: CrumbsLocationState = React.useMemo(() => {
		let crumbs: Crumbs = [
			{
				to: currentLocation,
				label: "Company search",
			},
		];

		if (data.chatId) {
			crumbs = [
				...crumbs,
				{
					label: `Chat with ${data.name}`,
				},
			] as Crumbs;
		} else {
			crumbs = [
				...crumbs,
				{
					label: `Message ${data.name}`,
				},
			] as Crumbs;
		}

		return {
			crumbs,
		};
	}, [currentLocation, data.chatId, data.name]);

	return {
		navigateTo,
		stateForTarget,
	};
};

const CompanyProfileCard = (props: CompanyToView) => {
	const { navigateTo, stateForTarget } =
		useChatNavigatePropsForEntitryView(props);
	const navigate = useNavigate();
	return (
		<CompanyDataCard
			companyData={props}
			onMessage={() => {
				void navigate(navigateTo, {
					state: stateForTarget,
				});
			}}
		/>
	);
};

export default function CompaniesSearch() {
	const [search, setSearch] = useQueryState(
		"search",
		parseAsString.withDefault(""),
	);

	const pagination = usePagination();

	const query = useQuery({
		...companiesSearchQueries.companies({
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
			search,
		}),
		placeholderData: keepPreviousData,
	});

	const { updateFromServerMeta } = pagination;
	React.useEffect(() => {
		updateFromServerMeta(query.data?.meta);
	}, [query.data?.meta, updateFromServerMeta]);

	const companies = query.data?.data;

	const contentState: ListContentState = React.useMemo(
		() => ({
			isLoadingList: query.isLoading,
			initialLoadingError:
				!query.isSuccess && query.error ? query.error : null,
			hasNoResults: query.isSuccess && !companies?.length,
			isRefetchingFreshData: query.isPlaceholderData && query.isFetching,
		}),
		[
			companies?.length,
			query.error,
			query.isFetching,
			query.isLoading,
			query.isPlaceholderData,
			query.isSuccess,
		],
	);

	return (
		<SearchableUserCardsList>
			<ListHeader>
				<SearchInput
					value={search}
					onChange={(e) => {
						const value = e.target.value;
						void setSearch(value ? value : null);
					}}
					placeholder="Search companies"
				/>
			</ListHeader>

			<ListContent contentState={contentState}>
				<ListLoadingIndicator>
					Loading companies... <LoadingIndicator />
				</ListLoadingIndicator>
				<ListNoResultsMessage
					title="No companies found"
					description="Try adjusting your filters or search terms to see more results."
				/>
				<ListLoadingErrorMessage>
					{(error) =>
						`Error loading companies: ${getErrorMessage(error)}`
					}
				</ListLoadingErrorMessage>

				<ListCardsGrid>
					{companies?.map((company) => {
						return (
							<ListCard key={company.id}>
								<ListProfileCard>
									<CompanyProfileCard {...company} />
								</ListProfileCard>

								<ListCardActions>
									<ProfileLinkButton
										userName={company.name}
										userId={company.id}>
										Profile
									</ProfileLinkButton>

									<JobsLinkButton
										companyId={company.id}
										companyName={company.name}>
										Jobs
									</JobsLinkButton>
								</ListCardActions>
							</ListCard>
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
		</SearchableUserCardsList>
	);
}
