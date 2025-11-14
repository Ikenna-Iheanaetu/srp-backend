/** @format */

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const ChatSkeleton = ({
	className,
	loadingError,
	onRetry,
}: {
	loadingError: string | null;
	onRetry: () => void;
	className?: string;
}) => {
	return (
		<div
			className={cn(
				"flex h-full flex-col justify-evenly gap-16 p-6",
				className,
			)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				{/* recipient details */}
				<div className="flex items-center gap-2">
					<Skeleton className="size-8 rounded-full" />
					<div className="flex flex-col gap-2">
						<Skeleton className="h-3.5 w-16" />
						<Skeleton className="h-2.5 w-28" />
					</div>
				</div>

				{/* options */}
				<Skeleton className="flex h-8 w-24 items-center justify-center bg-slate-50">
					<Skeleton className="h-2.5 w-16" />
				</Skeleton>
			</div>

			{/* message feed */}
			<div className="flex flex-1 flex-col justify-evenly gap-12 py-10">
				{/* from me txt msgs block */}
				<div className="flex flex-col items-end gap-2">
					<Skeleton className="flex h-14 w-[50%] items-center justify-start rounded-2xl bg-slate-50 p-4">
						<Skeleton className="h-2.5 w-1/2" />
					</Skeleton>
					<Skeleton className="flex h-14 w-[80%] items-center justify-start rounded-2xl bg-slate-50 p-4">
						<Skeleton className="h-2.5 w-1/2" />
					</Skeleton>
				</div>

				{/* from them txt msgs block */}
				<div className="flex flex-col items-start gap-2">
					<Skeleton className="flex h-14 w-[50%] items-center justify-start rounded-2xl bg-slate-50 p-4">
						<Skeleton className="h-2.5 w-1/2" />
					</Skeleton>
					<Skeleton className="flex h-14 w-[80%] items-center justify-start rounded-2xl bg-slate-50 p-4">
						<Skeleton className="h-2.5 w-1/2" />
					</Skeleton>
				</div>

				{/* from me txt + attachment msg block */}
				<div className="flex flex-col items-end gap-2">
					<Skeleton className="flex h-14 w-[70%] items-center justify-start rounded-2xl bg-slate-50 p-4">
						<Skeleton className="h-2.5 w-1/2" />
					</Skeleton>

					{/* attachment */}
					<Skeleton className="flex h-14 w-[50%] items-center gap-2 rounded-2xl bg-slate-50 p-4">
						<Skeleton className="flex aspect-square h-10 items-center justify-center bg-black">
							<Skeleton className="size-5 rounded-full bg-slate-200" />
						</Skeleton>

						<div className="flex w-[80%] flex-col gap-2">
							<Skeleton className="h-3.5 w-full" />
							<Skeleton className="h-2.5 w-1/2" />
						</div>
					</Skeleton>
				</div>
			</div>

			<div className="relative w-full">
				{loadingError && (
					<div className="absolute inset-x-2 bottom-full z-10 flex h-14 translate-y-1/2 items-center justify-between rounded-2xl border border-dashed border-red-100 bg-red-50 p-4 animate-in animate-out">
						<div className="flex flex-col justify-center">
							<p className="text-xs">Could not load chat</p>
							<p className="text-xs text-red-800">
								{loadingError}
							</p>
						</div>

						<Button
							variant={"ghost"}
							className="text-xs text-red-500 hover:bg-transparent hover:text-green-500 active:text-green-500"
							onClick={onRetry}>
							Retry
						</Button>
					</div>
				)}

				{/* message composer */}
				<Skeleton className="flex h-24 w-full items-end justify-between rounded-2xl bg-slate-50 p-4">
					<Skeleton className="size-5 rounded-full" />

					<Skeleton className="flex size-7 items-center justify-center rounded-full bg-lime-600">
						<Skeleton className="size-3 rounded-full bg-slate-200" />
					</Skeleton>
				</Skeleton>
			</div>
		</div>
	);
};
