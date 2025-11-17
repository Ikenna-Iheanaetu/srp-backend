/** @format */

"use client";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { PaginationState } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

export interface PaginationControlsProps extends PaginationState {
	totalItems: number;
	onPageIndexChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	/**
	 * A derived boolean from the `fetchStatus` variable, provided for convenience.
	 * - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch.
	 */
	isFetching?: boolean;
	className?: string;
	pageSizeOptions?: number[];
	siblingsCount?: number;
}

export function PaginationControls({
	pageIndex,
	pageSize,
	totalItems,
	onPageIndexChange,
	onPageSizeChange,
	isFetching,
	className,
	pageSizeOptions = [10, 20, 30, 40, 50],
	siblingsCount = 1,
}: PaginationControlsProps) {
	// Ensure pageIndex is never negative
	const safePageIndex = Math.max(0, pageIndex);

	const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
	const currentPage = safePageIndex + 1; // Convert 0-based page index to 1-based for UI

	const startItem = Math.min(safePageIndex * pageSize + 1, totalItems);
	const endItem = Math.min((safePageIndex + 1) * pageSize, totalItems);

	const paginationRange = useMemo((): (number | "ellipsis")[] => {
		const additionalPageNumbers = 5; // first, last, current page, and 2 ellipses
		const totalPageNumbers = siblingsCount + additionalPageNumbers;

		if (totalPageNumbers >= pageCount) {
			return Array.from({ length: pageCount }, (_, i) => i + 1);
		}

		const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
		const rightSiblingIndex = Math.min(
			currentPage + siblingsCount,
			pageCount
		);

		const shouldShowLeftDots = leftSiblingIndex > 2;
		const shouldShowRightDots = rightSiblingIndex < pageCount - 1;

		const firstPageIndex = 1;
		const lastPageIndex = pageCount;

		if (!shouldShowLeftDots && shouldShowRightDots) {
			const leftItemCount = 3 + 2 * siblingsCount;
			const leftRange = Array.from(
				{ length: leftItemCount },
				(_, i) => i + 1
			);
			return [...leftRange, "ellipsis", pageCount];
		}

		if (shouldShowLeftDots && !shouldShowRightDots) {
			const rightItemCount = 3 + 2 * siblingsCount;
			const rightRange = Array.from(
				{ length: rightItemCount },
				(_, i) => pageCount - rightItemCount + i + 1
			);
			return [firstPageIndex, "ellipsis", ...rightRange];
		}

		if (shouldShowLeftDots && shouldShowRightDots) {
			const middleRange = Array.from(
				{ length: rightSiblingIndex - leftSiblingIndex + 1 },
				(_, i) => leftSiblingIndex + i
			);
			return [
				firstPageIndex,
				"ellipsis",
				...middleRange,
				"ellipsis",
				lastPageIndex,
			];
		}

		return [];
	}, [currentPage, pageCount, siblingsCount]);

	return (
		<div
			className={cn(
				"sticky bottom-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-4 w-full bg-white p-2 border-t",
				className
			)}>
			<div className="text-sm text-muted-foreground order-2 sm:order-1">
				Showing{" "}
				<span className="font-medium">{Math.max(startItem, 0)}</span> to{" "}
				<span className="font-medium">{endItem}</span> of{" "}
				<span className="font-medium">{totalItems}</span> results
			</div>

			<div className="flex items-center gap-4 order-1 sm:order-2">
				{(() => {
					const ITEMS_PER_PAGE_ID = "rows-per-page";
					return (
						<div className="hidden items-center gap-2 lg:flex">
							<Label
								htmlFor={ITEMS_PER_PAGE_ID}
								className="text-sm font-medium whitespace-nowrap">
								Items per page
							</Label>
							<Select
								value={pageSize.toString()}
								onValueChange={(value) =>
									onPageSizeChange(Number(value))
								}>
								<SelectTrigger
									className="w-20"
									id={ITEMS_PER_PAGE_ID}>
									<SelectValue placeholder={pageSize} />
								</SelectTrigger>
								<SelectContent>
									{pageSizeOptions.map((size) => (
										<SelectItem
											key={size}
											value={size.toString()}>
											{size}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					);
				})()}

				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault();
									if (safePageIndex > 0) {
										onPageIndexChange(safePageIndex - 1);
									}
								}}
								className={cn(
									safePageIndex <= 0 &&
										"pointer-events-none opacity-50"
								)}
							/>
						</PaginationItem>

						{paginationRange.map((pageNumber, index) =>
							pageNumber === "ellipsis" ? (
								<PaginationItem key={`ellipsis-${index}`}>
									<PaginationEllipsis />
								</PaginationItem>
							) : (
								<PaginationItem key={pageNumber}>
									<PaginationLink
										href="#"
										onClick={(e) => {
											e.preventDefault();
											onPageIndexChange(
												Number(pageNumber) - 1
											);
										}}
										isActive={pageNumber === currentPage}>
										{pageNumber}
									</PaginationLink>
								</PaginationItem>
							)
						)}

						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault();
									if (safePageIndex < pageCount - 1) {
										onPageIndexChange(safePageIndex + 1);
									}
								}}
								className={cn(
									safePageIndex >= pageCount - 1 &&
										"pointer-events-none opacity-50"
								)}
							/>
						</PaginationItem>
					</PaginationContent>

					{typeof isFetching === "boolean" && (
						// only show this when isPending is supplied
						<div
							aria-label={isFetching ? "Loading" : "Idle"}
							aria-live={isFetching ? "polite" : undefined}
							className={cn(
								"h-2 w-2 rounded-full bg-green-500",
								isFetching && "animate-pulse bg-amber-500"
							)}
						/>
					)}
				</Pagination>
			</div>
		</div>
	);
}
