/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import type { FC } from "react";

interface OverlayLoaderProps {
	isLoading: boolean;
	message?: string;
}

export const OverlayLoader: FC<OverlayLoaderProps> = ({
	isLoading,
	message = "Loading new results...",
}) => {
	if (!isLoading) return null;

	return (
		<div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10 backdrop-blur-[1px]">
			<div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-3">
				<LoadingIndicator />
				<span className="text-sm font-medium text-gray-700">
					{message}
				</span>
			</div>
		</div>
	);
};
