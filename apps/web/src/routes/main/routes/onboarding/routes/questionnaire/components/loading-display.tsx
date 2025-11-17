/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";

export function LoadingDisplay() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
			<div className="flex flex-col items-center gap-4">
				<LoadingIndicator />
				<p className="text-lg font-medium text-gray-600">
					Loading questions...
				</p>
			</div>
		</div>
	);
}
