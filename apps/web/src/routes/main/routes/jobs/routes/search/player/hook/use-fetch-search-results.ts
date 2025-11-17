/** @format */

import { useFilterByUrlParams } from "@/hooks/use-filter-by-url-params-nuqs";
import { usePagination } from "@/hooks/use-pagination";
import { useSearchByURLParams } from "@/hooks/use-search-by-url-params";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { jobsQueries } from "../../../../query-factory";
import { filterParsers } from "../filters-block";

export function useFetchSearchResults() {
	const { searchQuery } = useSearchByURLParams();
	const pagination = usePagination();

	const { filters } = useFilterByUrlParams({
		parsers: filterParsers,
	});

	const queryOptions = useMemo(() => {
		return jobsQueries.search({
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
			search: searchQuery,
			...filters,
		});
	}, [pagination.pageIndex, pagination.pageSize, searchQuery, filters]);

	const queryResult = useQuery(queryOptions);

	// Sync pagination with server meta when data changes
	useEffect(() => {
		if (queryResult.data?.meta) {
			pagination.updateFromServerMeta(queryResult.data.meta);
		}
	}, [queryResult.data?.meta, pagination.updateFromServerMeta]);

	return useMemo(
		() => ({
			queryOptions,
			...pagination,
			queryKey: queryOptions.queryKey,
			totalItems: queryResult.data?.meta?.total ?? 0,
		}),
		[queryOptions, pagination, queryResult.data?.meta?.total]
	);
}
