/** @format */

import {
	isRouteErrorResponse,
	Link,
	Navigate,
	useRouteError,
} from "react-router";

export function ErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		return (
			<div>
				<h1>
					{error.status} {error.statusText}
				</h1>
				<p>{error.data}</p>
			</div>
		);
	}

	return <Navigate to="/dashboard" />;
}

export default function Component() {
	return (
		<div className="flex flex-col items-center justify-between min-h-dvh py-16">
			<div className="flex-1 flex flex-col items-center justify-center">
				{/* 404 heading */}
				<h1 className="text-[180px] font-medium text-[#444444] leading-tight">
					404
				</h1>

				<p className="text-[#444444] text-xl mb-8">Page not found</p>

				<Link
					to="/dashboard"
					className="w-64 button py-3 rounded text-center">
					Return Home
				</Link>
			</div>

			{/* Footer */}
			<div className="text-gray-500 text-sm">
				© 2023 Sports&Rekrytering
			</div>
		</div>
	);
}
