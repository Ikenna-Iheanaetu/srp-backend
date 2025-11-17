/** @format */

import { usePagination } from "@/hooks/use-pagination";
import { parseAsString, useQueryState } from "nuqs";
import React from "react";
import { useParams } from "react-router";
import { companiesSearchQueries } from "../../../query-factory";
import { keepPreviousData } from "@tanstack/react-query";

export const useJobsByCompanyQueryConfig = () => {
	const [search, setSearch] = useQueryState(
		"search",
		parseAsString.withDefault("")
	);
	const pagination = usePagination();

	const { id: companyId } = useParams();
	if (!companyId) {
		throw new Error(
			"[CompanyJobs]: Invalid URL path; 'id' param is missing or nullish."
		);
	}

	const queryOptions = React.useMemo(
		() => ({
			...companiesSearchQueries.jobsByCompany({
				page: pagination.pageIndex + 1,
				limit: pagination.pageSize,
				search,
				companyId,
			}),
			placeholderData: keepPreviousData,
		}),
		[companyId, pagination.pageIndex, pagination.pageSize, search]
	);

	return {
		search,
		setSearch,
		pagination,
		queryOptions,
		companyId,
	};
};
