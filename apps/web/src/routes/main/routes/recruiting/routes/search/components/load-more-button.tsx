/** @format */

"use client";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown } from "lucide-react";

interface LoadMoreProps {
	isLoading: boolean;
	hasMorePages: boolean;
	onLoadMore: () => void;
}

export const LoadMore = ({
	isLoading,
	hasMorePages,
	onLoadMore,
}: LoadMoreProps) => {
	if (!hasMorePages) return null;

	return (
		<div className="flex justify-center p-2 border-t">
			<Button
				variant="ghost"
				size="sm"
				onClick={onLoadMore}
				disabled={isLoading}
				className="w-full flex items-center justify-center">
				{isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin mr-2" />
				) : (
					<ChevronDown className="h-4 w-4 mr-2" />
				)}
				Load more
			</Button>
		</div>
	);
};
