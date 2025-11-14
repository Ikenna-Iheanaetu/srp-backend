/** @format */

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { FilterIcon } from "lucide-react";

export interface TableSkeletonProps {
	numCols?: number;
	numRows?: number;
}

export function TableSkeleton({
	numRows = 5,
	numCols = 4,
}: TableSkeletonProps) {
	const rows = Array.from(Array(numRows).keys());
	const cols = Array.from(Array(numCols).keys());

	return (
		<>
			{/* Mobile card view (only visible on small screens) */}
			<div className="space-y-4 md:hidden">
				{rows.map((_, rowIndex) => (
					<div
						key={rowIndex}
						className="rounded-md border p-4 space-y-3">
						{cols.map((_, colIndex) => (
							<div
								key={colIndex}
								className="flex items-center justify-between">
								<Skeleton className="h-[16px] w-[80px]" />
								<Skeleton className="h-[24px] w-[120px]" />
							</div>
						))}
					</div>
				))}
			</div>

			{/* Table view (hidden on mobile, scrollable on tablet) */}
			<div className="hidden md:block overflow-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							{cols.map((_, index) => (
								<TableHead
									key={index}
									className="whitespace-nowrap">
									<Skeleton className="h-[20px] w-[75px]" />
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((_, index) => (
							<TableRow key={index} className="h-12">
								{cols.map((_, index2) => (
									<TableCell
										key={index2}
										className="whitespace-nowrap">
										<Skeleton className="h-[30px] w-full max-w-[140px]" />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Responsive pagination controls */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4 sm:gap-2">
				<div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
					<Skeleton className="h-[20px] w-full sm:w-[200px]" />
					<Skeleton className="h-[20px] w-full sm:w-[150px]" />
				</div>
				<div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
					<Button
						variant="outline"
						size="sm"
						disabled
						className="flex-1 sm:flex-none">
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled
						className="flex-1 sm:flex-none">
						Next
					</Button>
				</div>
			</div>
		</>
	);
}

export function TableFilterSkeleton() {
	return (
		<div className="mb-4">
			<Button variant="outline" className="h-7 w-full sm:w-auto" disabled>
				<FilterIcon className="size-4 mr-2" />
				<span>Filter</span>
			</Button>
		</div>
	);
}
