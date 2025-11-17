/** @format */

import { ServerPaginationMeta } from "@/types/pagination";
import {
	Pagination,
	PaginationSchema,
	PaginationState,
	ServerPaginationParams,
} from "../schemas/pagination";

// Function Overload 1
export function convertPagination<T extends PaginationState>(
	obj: T,
): Prettify<Prettify<Omit<T, keyof PaginationState>> & ServerPaginationParams>;

// Function Overload 2
export function convertPagination<T extends ServerPaginationParams>(
	obj: T,
): Prettify<Prettify<Omit<T, keyof ServerPaginationParams>> & PaginationState>;

/**
 * Automatically converts an object between {@link PaginationState} `{pageIndex, pageSize}` and {@link ServerPaginationParams} `{page, limit}` pagination formats,
 * where page is 1-based for UI and server. Returns unchanged object if validation fails. Allows extra properties.
 *
 * The return type is a union of the two possible conversion outcomes (preserving original extra properties)
 * and the original input type `T`, which is returned if the input object fails validation.
 */
export function convertPagination<T extends Pagination>(
	obj: T,
):
	| (Omit<T, keyof PaginationState> & ServerPaginationParams)
	| (Omit<T, keyof ServerPaginationParams> & PaginationState)
	| T {
	const result = PaginationSchema.safeParse(obj);

	if (!result.success) {
		return obj;
	}

	if ("pageIndex" in result.data) {
		return {
			...obj,
			page: result.data.pageIndex + 1,
			limit: result.data.pageSize,
		} as Omit<T, keyof PaginationState> & ServerPaginationParams;
	}

	return {
		...obj,
		pageIndex: result.data.page ? result.data.page - 1 : undefined,
		pageSize: result.data.limit,
	} as Omit<T, keyof ServerPaginationParams> & PaginationState;
}

interface CalculateNewMetaParams {
	newDataTotal: number;
	prevMeta: ServerPaginationMeta;
}

/**
 * Calculates new meta based on new total item count.
 * * @param newDataTotal The new total number of items after an operation (e.g., deletion or filtering).
 * * @example
 * ```ts
 * // Example of calculating newDataTotal after removing items from a local array:
 * const actualItemsRemoved = old.data.length - filteredItems.length;
 * const newDataTotal = old.meta.total - actualItemsRemoved;
 * ```
 */
export function calculateNewMeta(
	newDataTotal: CalculateNewMetaParams["newDataTotal"],
	prevMeta: CalculateNewMetaParams["prevMeta"],
): ServerPaginationMeta;

/**@deprecated Use the function args overload instead */
export function calculateNewMeta(
	params: CalculateNewMetaParams,
): ServerPaginationMeta;

/**Calculates new meta based on new total item count. */
export function calculateNewMeta(
	// Arg1 can be either the new total (number) or the parameters object
	arg1: CalculateNewMetaParams["newDataTotal"] | CalculateNewMetaParams,
	// Arg2 is only present for the new two-argument overload
	arg2?: CalculateNewMetaParams["prevMeta"],
) {
	let newDataTotal: number;
	let prevMeta: ServerPaginationMeta;

	// Check if the two-argument overload was used
	if (arg2 !== undefined) {
		// Overload: calculateNewMeta(newDataTotal, prevMeta)
		newDataTotal = arg1 as number;
		prevMeta = arg2;
	} else {
		// Overload: calculateNewMeta(params) - Deprecated
		const params = arg1 as CalculateNewMetaParams;
		newDataTotal = params.newDataTotal;
		prevMeta = params.prevMeta;
	}

	const newTotalPages = Math.ceil(newDataTotal / prevMeta.limit);
	const newPage = Math.max(1, Math.min(prevMeta.page, newTotalPages));

	return {
		...prevMeta,
		total: newDataTotal,
		totalPages: newTotalPages,
		page: newPage,
	} satisfies ServerPaginationMeta;
}
