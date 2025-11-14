/** @format */

import type {
	ColumnConfig,
	ColumnDataType,
} from "@/components/data-table-filter/core/types";
import { ColumnMeta as OriginalColumnMeta } from "@tanstack/react-table";
import { UnionToIntersection } from ".";
import { ServerPaginationParams } from "./pagination";
import { BazzaQueryFilters, TableQueryParams } from "./tanstack-table";

/**
 * @see {@link https://tanstack.com/table/v8/docs/api/core/column-def#meta}
 */
declare module "@tanstack/react-table" {
	interface ColumnMeta<TData, TValue>
		extends OriginalColumnMeta<TData, TValue> {
		// TODO: Remove this when the Data Table filters are moved to server-side
		/**
		 * @deprecated Data Table filters are now moving to server-side */
		isGlobalDateFilter?: boolean; // Custom property for global date range filtering
	}
}

interface DefaultTableFilters {
	search?: string;
}

interface DefaultTableQueryParams
	extends ServerPaginationParams,
		DefaultTableFilters {}

type TableQueryParams<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	TFilters = {}
> = Prettify<Partial<Merge<TFilters, DefaultTableQueryParams>>>;

/**
 * A looser version of {@link ColumnConfig} for use with the `satisfies` keyword
 * to avoid type parameter mismatches.
 * Use {@link ColumnConfig} for all other scenarios requiring strict types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterColumnConfig<TData> = ColumnConfig<TData, any, any, any>;

/**
 * "number" has a type that is not an array filter type, but we're not
 * including that cause we're not using it (for now).
 */
type NonArrayFilterType = SafeExtract<ColumnDataType, "text">;

/**
 * @param T should be of type {@link ColumnConfig}[], else you get `never`
 */
export type BazzaQueryFilters<T> = UnionToIntersection<
	T[number] extends infer C
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any
		  C extends ColumnConfig<any, infer TType, infer TVal, infer TId>
			? Record<TId, TType extends NonArrayFilterType ? TVal : TVal[]>
			: never
		: never
>;

/**
 *
 * @param T Should be of type {@link ColumnConfig}[] */
export type TableQueryFiltersFromColumns<T> = TableQueryParams &
	BazzaQueryFilters<T>;
