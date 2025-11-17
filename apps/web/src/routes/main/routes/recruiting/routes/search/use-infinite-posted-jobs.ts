/** @format */

import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { postedJobsQueries } from "../../../job-management/routes/job-posted/query-factory";

interface UseInfiniteJobsProps {
	search?: string;
}

export function useInfiniteJobs({ search = "" }: UseInfiniteJobsProps = {}) {
	const { pageSize, setPageSize } = usePagination({ syncToUrl: false });

	const query = useQuery({
		...postedJobsQueries.jobs({
			search,
			limit: pageSize,
			status: ['active'],
		}),
		placeholderData: keepPreviousData,
	});

	const jobsData = query.data;

	const loadMore = useCallback(() => {
		if (jobsData && pageSize < jobsData.meta.total) {
			setPageSize((prev) => prev + DEFAULT_PAGE_SIZE);
		}
	}, [jobsData, pageSize, setPageSize]);

	const hasMore = useMemo(
		() => (jobsData ? pageSize < jobsData.meta.total : false),
		[jobsData, pageSize]
	);

	return useMemo(
		() => ({
			...query,
			hasMore,
			loadMore,
		}),
		[hasMore, loadMore, query]
	);
}
