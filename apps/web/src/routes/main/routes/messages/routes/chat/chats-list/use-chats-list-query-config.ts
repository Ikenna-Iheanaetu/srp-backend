/** @format */

import { keepPreviousData } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import React from "react";
import { chatsListSearchParams } from "./schemas";
import { chatQueries } from "../query-factory";

export const useChatsListQueryConfig = () => {
	const [searchParams, setSearchParams] = useQueryStates(
		chatsListSearchParams,
	);
	const { search, status } = searchParams;
	const queryOptions = React.useMemo(
		() => ({
			...chatQueries.infiniteChats({
				search,
				status: status ?? undefined,
			}),
			placeholderData: keepPreviousData,
		}),
		[search, status],
	);

	return {
		queryOptions,
		searchParams,
		setSearchParams,
	};
};
