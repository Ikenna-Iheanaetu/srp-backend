/** @format */

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { runInDevOnly } from "@/lib/helper-functions/run-only-in-dev-mode";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import {
	PaginatedServerResponse,
	ServerPaginationParams,
} from "@/types/pagination";
import React from "react";
import { toast } from "sonner";

type InfiniteClubsQuery = { fetchNextPage: () => Promise<void> } & (
	| // Initial data fetch
	{
			isLoading: true;
			isFetching: true;
			isFetchingNextPage: false;
			hasNextPage: false;
			data: null;
			error: null;
	  }
	// initial successful data fetch
	| {
			isLoading: false;
			isFetching: false;
			isFetchingNextPage: false;
			hasNextPage: boolean;
			data: {
				pages: PaginatedServerResponse<ClubProfileData>[];
				pageParams: number[];
			};
			error: null;
	  }
	// initial failed data fetch
	| {
			isLoading: false;
			isFetching: false;
			isFetchingNextPage: false;
			hasNextPage: false;
			data: null;
			error: string;
	  }
	// retry data fetch from failed initial fetch
	| {
			isLoading: true;
			isFetching: true;
			isFetchingNextPage: false;
			hasNextPage: false;
			data: null;
			error: string;
	  }

	// subsequent next page data fetch from initial success fetch
	| {
			isLoading: false;
			isFetching: true;
			isFetchingNextPage: true;
			hasNextPage: true;
			data: {
				pages: PaginatedServerResponse<ClubProfileData>[];
				pageParams: number[];
			};
			error: null;
	  }
	// successful subsequent next page data fetch from initial success fetch
	// return is same as initial success fetch

	// failed subsequent next page data fetch from initial success fetch
	| {
			isLoading: false;
			isFetching: false;
			isFetchingNextPage: false;
			hasNextPage: true;
			data: {
				pages: PaginatedServerResponse<ClubProfileData>[];
				pageParams: number[];
			}; // data from previous fetch
			error: string;
	  }
);

export type AllClubsQueryParams = ServerPaginationParams & {
	search?: string;
};

const fetchAllClubs = async (
	params: AllClubsQueryParams,
): Promise<PaginatedServerResponse<ClubProfileData>> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: PaginatedServerResponse<ClubProfileData> }>
	>("/clubs", {
		skipUserTypePrefix: true,
		skipAuthHeader: true,
		skipAuthRefresh: true,
		params,
	});

	return response.data.data;
};

export const useAllClubsQuery = ({
	params = {
		limit: DEFAULT_PAGE_SIZE,
	},
}: {
	params?: SafeOmit<AllClubsQueryParams, "page">;
} = {}): InfiniteClubsQuery => {
	const [query, setQueryState] = React.useState<
		SafeOmit<InfiniteClubsQuery, "fetchNextPage" | "isFetching">
	>({
		isLoading: true,
		isFetchingNextPage: false,
		hasNextPage: false,
		data: null,
		error: null,
	});

	React.useEffect(() => {
		let ignore = false;
		const handleInitialFetch = async () => {
			setQueryState({
				isLoading: true,
				isFetchingNextPage: false,
				hasNextPage: false,
				data: null,
				error: null,
			});

			try {
				const data = await fetchAllClubs({
					...params,
					page: DEFAULT_PAGE_NUMBER,
				});
				if (!ignore) {
					setQueryState((prev) => {
						if (!prev.isLoading) {
							runInDevOnly(() =>
								console.error(
									"[useAllClubsQuery]: Prev state wasn't initially loading. Aborting successful initial data fetch state transition",
									prev,
								),
							);
							return prev;
						}

						const hasNextPage =
							data.meta.totalPages > data.meta.page;

						return {
							isLoading: false,
							isFetching: false,
							isFetchingNextPage: false,
							error: null,
							hasNextPage,
							data: {
								pages: [data],
								pageParams: [
									data.meta.page, // Didn't use the DEFAULT_PAGE_NUMBER because api might return a different current page
								],
							},
						};
					});
				}
			} catch (e) {
				if (!ignore) {
					const error = getApiErrorMessage(e);
					setQueryState((prev) => {
						if (!prev.isLoading) {
							runInDevOnly(() =>
								console.error(
									"[useAllClubsQuery]: Prev state wasn't initial loading. Aborting Failed initial fetch state transition",
									prev,
								),
							);
							return prev;
						}

						return {
							isLoading: false,
							isFetching: false,
							isFetchingNextPage: false,
							data: null,
							hasNextPage: false,
							error,
						};
					});
					toast.error("Error fetching clubs", {
						description: error,
					});
				}
			}
		};

		void handleInitialFetch();
		return () => {
			ignore = true; // when a new fetch starts ignore the result from last fetch
		};
	}, [params]);

	const { isFetchingNextPage, hasNextPage, data } = query;

	const fetchNextPage: InfiniteClubsQuery["fetchNextPage"] =
		React.useCallback(async () => {
			if (isFetchingNextPage || !hasNextPage) {
				return;
			}

			setQueryState((prev) => {
				if (!prev.hasNextPage) {
					runInDevOnly(() =>
						console.error(
							"[useAllClubsQuery]: Prev state has no next page. Aborting fetch next page state transition",
							prev,
						),
					);

					return prev;
				}

				return {
					...prev,
					isFetchingNextPage: true,
					isFetching: true,
					hasNextPage: true,
					error: null,
				};
			});

			let nextPageParam = DEFAULT_PAGE_NUMBER;
			const totalPages = data.pages.length;
			const currentPage = data.pages[totalPages - 1]?.meta.page;
			if (currentPage) {
				nextPageParam = currentPage + 1;
			}

			try {
				const data = await fetchAllClubs({
					...params,
					page: nextPageParam,
				});

				setQueryState((prev) => {
					if (!prev.isFetchingNextPage) {
						runInDevOnly(() =>
							console.error(
								"[useAllClubsQuery]: Prev state wasn't fetching next page. Aborting successful fetch next page state transition",
								prev,
							),
						);
						return prev;
					}

					const hasNextPage = data.meta.totalPages > data.meta.page;

					return {
						...prev,
						isFetchingNextPage: false,
						isFetching: false,
						hasNextPage,
						data: {
							pages: [...prev.data.pages, data],
							pageParams: [
								...prev.data.pageParams,
								data.meta.page, // Didn't use the above nextPageParam because api might return a different current page
							],
						},
					};
				});
			} catch (e) {
				const error = getApiErrorMessage(e);
				setQueryState((prev) => {
					if (!prev.isFetchingNextPage) {
						runInDevOnly(() =>
							console.error(
								"[useAllClubsQuery]: Prev state wasn't fetching next page. Aborting Failed fetch next page state transition",
								prev,
							),
						);
						return prev;
					}

					return {
						...prev,
						isFetching: false,
						isFetchingNextPage: false,
						error,
					};
				});
				toast.error("Error fetching more clubs", {
					description: error,
				});
			}
		}, [data?.pages, hasNextPage, isFetchingNextPage, params]);

	return {
		...query,
		isFetching: query.isLoading || query.isFetchingNextPage,
		fetchNextPage,
	} as InfiniteClubsQuery;
};
