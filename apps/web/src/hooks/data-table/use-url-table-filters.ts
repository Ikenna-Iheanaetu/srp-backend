/** @format */

// prettier-ignore
/* eslint-disable @typescript-eslint/unbound-method */

import type { FilterOperators, FiltersState, TextFilterOperator } from "@/components/data-table-filter/core/types";
import { CheckIfObject } from "@/types";
import {
	DefaultTableFilters,
	NonArrayFilterType,
} from "@/types/tanstack-table";
import { parseAsString, useQueryState } from "nuqs";
import { parseAsJson } from "nuqs/server";

import { useMemo } from "react";
import { z } from "zod";

/**
 * Returns the type of filters returned from URLSearchParams.
 * To infer filters from {@link ColumnConfig} array,
 * use {@link TableQueryFiltersFromColumns}.
 */
interface TableQueryFiltersFromSearch extends DefaultTableFilters {
	filters: FiltersState;
}

const bazzaFiltersSchema = z.custom<FiltersState>();

const _textOperators = {
	contains: "",
	"does not contain": "",
} as const satisfies Record<TextFilterOperator, "">;
const textOperators = Object.keys(
	_textOperators
) as (keyof typeof _textOperators)[];

type ArrayFilterModelOperators = FilterOperators[NonArrayFilterType];
const nonArrayOperators = textOperators satisfies ArrayFilterModelOperators[];
// NOTE: The above setup might look bulky but it's for
// type-safety to ensure we don't miss any value.

const createQueryFilters = <T = Record<string, unknown[]>>({
	search,
	filters,
}: TableQueryFiltersFromSearch) =>
	({
		search,
		...filters.reduce(
			(accumulator, filterModel) => {
				const { columnId, operator, values } = filterModel;
				const isNonArrayOperator = nonArrayOperators.some(
					(item) => item === operator
				);
				accumulator[columnId] = isNonArrayOperator
					? values[0] // non array operator values will always have a single item
					: values;
				return accumulator;
			},
			{} as Record<string, unknown>
		),
	}) as DefaultTableFilters & CheckIfObject<T>;

/**
 * @param T Should be the type of the Filters from the Bazza {@link ColumnConfig}
 * @returns states from the URL search params and methods to update them.
 */
const useURLTableQueryFilters = <T = Record<string, unknown[]>>() => {
	const [search, setSearch] = useQueryState(
		"search",
		parseAsString.withDefault("")
	);
	const [filters, setFilters] = useQueryState(
		"filters",
		parseAsJson(bazzaFiltersSchema.parse).withDefault([])
	);

	/**Query Filters to use in the Table Query request - Tanstack Query */
	const queryFilters = useMemo(
		() =>
			createQueryFilters<T>({
				filters,
				search,
			}),
		[filters, search]
	);

	return useMemo(
		() => ({
			queryFilters,
			filters,
			setFilters,
			search,
			setSearch,
		}),
		[filters, queryFilters, search, setFilters, setSearch]
	);
};

export { useURLTableQueryFilters };
export type { TableQueryFiltersFromSearch as TableQueryFilters };
