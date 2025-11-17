/** @format */

import { usePagination } from "@/hooks/use-pagination";
import { TableQueryParams } from "@/types/tanstack-table";
import { useMemo } from "react";
import { useURLTableQueryFilters } from "./use-url-table-filters";

/**
 * @param T The interface of the bazza filters
 */
export const useURLTableQueryParams = <T = Record<string, unknown[]>>() => {
	const filtersFromSearchParams = useURLTableQueryFilters<T>();
	const { queryFilters } = filtersFromSearchParams;

	const pagination = usePagination({ syncToUrl: true });
	const { pageSize, pageIndex } = pagination;

	/**Params to use in your table data query */
	const queryParams = useMemo(
		() =>
			({
				page: pageIndex + 1,
				limit: pageSize,
				...queryFilters,
			}) as TableQueryParams & typeof queryFilters,
		[pageIndex, pageSize, queryFilters]
	);

	return useMemo(
		() => ({
			queryParams,
			filtersFromSearchParams,
			pagination,
		}),
		[pagination, queryParams, filtersFromSearchParams]
	);
};
