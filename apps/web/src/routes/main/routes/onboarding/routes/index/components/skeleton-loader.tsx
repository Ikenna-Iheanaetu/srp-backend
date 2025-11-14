/** @format */

import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeletonLoader() {
	return (
		<div className="p-6 bg-gray-100 rounded-lg shadow-md flex-1 flex flex-col justify-between gap-4 w-full max-h-[70dvh] overflow-y-hidden">
			{/* Title Skeleton */}
			<Skeleton className="h-6 w-2/3" />

			{/* Date Range Skeleton */}
			<div className="flex flex-col gap-2">
				<Skeleton className="h-10 w-full flex items-center gap-2 pl-2">
					<Skeleton className="h-4 w-4 rounded-full" />
				</Skeleton>
			</div>

			{/* Job Title Input Skeleton */}
			<div className="flex flex-col gap-4 h-xs:hidden">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>

			{/* Toggle Switches Skeleton */}
			<div className="mt-4 flex flex-col gap-2">
				<Skeleton className="h-8 w-3/4" />
				<Skeleton className="h-8 w-3/4" />
			</div>

			{/* Buttons Skeleton */}
			<div className="flex justify-between">
				<Skeleton className="h-10 w-20" />

				<div className="flex-1 flex justify-end gap-2">
					<Skeleton className="h-10 w-20" />
					<Skeleton className="h-10 w-20 bg-lime-400" />
				</div>
			</div>
		</div>
	);
}
