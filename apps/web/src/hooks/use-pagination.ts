/** @format */

import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { PaginationState } from "@/lib/schemas/pagination";
import type { ServerPaginationMeta } from "@/types/pagination";
import type { PaginationTableState, Updater } from "@tanstack/react-table";
import {
	createLoader,
	parseAsIndex,
	parseAsInteger,
	useQueryStates,
} from "nuqs";
import { useCallback, useMemo, useState, useTransition } from "react";

export type { PaginationState }; // exported again here for backward compatibility

export type PaginationStateEmitter = (
	state: PaginationState
) => PaginationState;

type Setter = number | ((value: number) => number);
type PaginationChanger = (value: Setter) => void;

export interface PaginationInstance extends PaginationState {
	isPending: boolean;
	setPageIndex: PaginationChanger;
	setPageSize: PaginationChanger;
	previousPage: () => void;
	nextPage: () => void;
	getCanPreviousPage: () => boolean;
	getCanNextPage: () => boolean;
	updateFromServerMeta: (meta?: ServerPaginationMeta) => void;
}

interface UsePaginationProps {
	initialState?: PaginationState;
	/**Controls whether to sync pagination state to URL search params.
	 * @default true
	 */
	syncToUrl?: boolean;
}

const paginationUrlKeys = {
	pageIndex: "page",
	pageSize: "perPage",
} as const satisfies Record<keyof PaginationState, string>;

const createPaginationParsers = (initialIndex?: number, initialSize?: number) =>
	({
		pageIndex: parseAsIndex.withDefault(initialIndex ?? 0),
		pageSize: parseAsInteger.withDefault(initialSize ?? DEFAULT_PAGE_SIZE),
	}) as const;

/**For use in clientLoaders */
export const loadPaginationParams = (
	request: Request,
	{ pageIndex, pageSize }: Partial<PaginationState> = {}
) => {
	const paramsLoader = createLoader(
		createPaginationParsers(pageIndex, pageSize),
		{ urlKeys: paginationUrlKeys }
	);

	return paramsLoader(request);
};

/**Handles pagination and optionally syncs to the URL search params
 * * Primarily used for server-side pagination
 */
export const usePagination = ({
	initialState = { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE },
	syncToUrl = true,
}: UsePaginationProps = {}): PaginationInstance => {
	const [pageCount, setPageCount] = useState(-1);
	const [isPending, startTransition] = useTransition();
	const localPagination = useState(initialState);

	const paginationParsers = useMemo(() => {
		const paginationParsers = createPaginationParsers(
			initialState.pageIndex,
			initialState.pageSize
		);
		return {
			...paginationParsers,
			pageIndex: paginationParsers.pageIndex.withOptions({
				startTransition,
			}),
		};
	}, [initialState.pageIndex, initialState.pageSize]);

	const urlPagination = useQueryStates(paginationParsers, {
		urlKeys: paginationUrlKeys,
	});

	const [paginationState, setPaginationState] = useMemo(
		() => (syncToUrl ? urlPagination : localPagination),
		[localPagination, syncToUrl, urlPagination]
	);

	const setPageIndex = useCallback(
		(index: Setter) => {
			void setPaginationState((prev) => {
				const newIndex =
					index instanceof Function ? index(prev.pageIndex) : index;
				return { ...prev, pageIndex: Math.max(0, newIndex) };
			});
		},
		[setPaginationState]
	);

	const setPageSize = useCallback(
		(size: Setter) => {
			void setPaginationState((prev) => ({
				...prev,
				pageIndex: 0, // Revert to first item for good UX
				pageSize: size instanceof Function ? size(prev.pageSize) : size,
			}));
		},
		[setPaginationState]
	);

	const previousPage = useCallback(() => {
		if (paginationState.pageIndex > 0) {
			setPageIndex(paginationState.pageIndex - 1);
		}
	}, [paginationState.pageIndex, setPageIndex]);

	const nextPage = useCallback(() => {
		if (paginationState.pageIndex < pageCount - 1) {
			setPageIndex(paginationState.pageIndex + 1);
		}
	}, [pageCount, paginationState.pageIndex, setPageIndex]);

	const getCanPreviousPage = useMemo(
		() => () => paginationState.pageIndex > 0,
		[paginationState.pageIndex]
	);

	const getCanNextPage = useMemo(
		() => () => paginationState.pageIndex < pageCount - 1,
		[pageCount, paginationState.pageIndex]
	);

	const updateFromServerMeta = useCallback(
		(meta?: ServerPaginationMeta) => {
			if (meta) {
				void setPaginationState((prev) => {
					const newPageIndex = getPageIndexFromMeta(meta);

					return {
						...prev,
						pageIndex: newPageIndex,
						pageSize: meta.limit,
					};
				});
				startTransition(() => setPageCount(meta.totalPages));
			}
		},
		[setPaginationState]
	);

	const safePageIndex = Math.max(0, paginationState.pageIndex);

	return useMemo(
		() => ({
			pageIndex: safePageIndex,
			pageSize: paginationState.pageSize,
			isPending,
			setPageIndex,
			setPageSize,
			previousPage,
			nextPage,
			getCanPreviousPage,
			getCanNextPage,
			updateFromServerMeta,
		}),
		[
			safePageIndex,
			paginationState.pageSize,
			isPending,
			setPageIndex,
			setPageSize,
			previousPage,
			nextPage,
			getCanPreviousPage,
			getCanNextPage,
			updateFromServerMeta,
		]
	);
};

export function getPageIndexFromMeta(meta: ServerPaginationMeta) {
	return Math.max(
		0,
		Math.min(Math.max(meta.page - 1, 0), meta.totalPages - 1)
	);
}

interface HandlerTablePaginationChangeProps
	extends Pick<PaginationInstance, "setPageIndex" | "setPageSize"> {
	updater: Updater<PaginationTableState["pagination"]>;
	prevState: PaginationTableState["pagination"];
}

export const handleTablePaginationChange = ({
	updater,
	prevState,
	setPageIndex,
	setPageSize,
}: HandlerTablePaginationChangeProps) => {
	const newPagination =
		updater instanceof Function ? updater(prevState) : updater;

	if (prevState.pageIndex !== newPagination.pageIndex) {
		setPageIndex(newPagination.pageIndex);
	}
	if (prevState.pageSize !== newPagination.pageSize) {
		setPageSize(newPagination.pageSize);
	}
};
