/** @format */

import { usePagination } from "@/hooks/use-pagination";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router";
import { shortlistedJobsQueries } from "../../query-factory";

export const useMutationSetup = () => {
	const { id: jobId } = useParams();
	const { pageIndex, pageSize } = usePagination();
	const queryKey = shortlistedJobsQueries.candidates({
		jobId: jobId ?? "",
		page: pageIndex + 1,
		limit: pageSize,
	}).queryKey;

	const queryClient = useQueryClient();

	return useMemo(
		() => ({
			queryClient,
			queryKey,
			jobId,
		}),
		[jobId, queryClient, queryKey]
	);
};
