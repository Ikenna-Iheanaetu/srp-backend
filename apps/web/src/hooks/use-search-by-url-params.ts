/** @format */

import { useCallback, useDeferredValue, useMemo } from "react";
import { parseAsString, useQueryState } from "nuqs";

export const useSearchByURLParams = () => {
	const [searchQuery, setSearchQuery] = useQueryState(
		"search",
		parseAsString.withDefault("")
	);

	// Handle search query changes
	const handleSearchChange = useCallback(
		(query: string) => {
			const newSearchQuery = query.trim();
			void setSearchQuery(newSearchQuery || null); // null removes the param when empty
		},
		[setSearchQuery]
	);

	const deferredQuery = useDeferredValue(searchQuery);

	return useMemo(
		() => ({
			searchQuery: deferredQuery,
			handleSearchChange,
		}),
		[deferredQuery, handleSearchChange]
	);
};
