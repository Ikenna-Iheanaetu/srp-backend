/** @format */

"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/common/link-btn";
import { href } from "react-router";

interface ErrorDisplayProps {
	heading: string;
	message: string;
	refetch: () => void;
	iconClassName?: string;
}

export function ErrorDisplay({
	heading,
	message,
	refetch,
	iconClassName,
}: ErrorDisplayProps) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-xl rounded-lg border p-6 shadow-sm bg-white text-center">
				<div className="mb-4 flex justify-center">
					<AlertCircle
						className={`h-12 w-12 text-red-500 ${iconClassName}`}
					/>
				</div>
				<h2 className="mb-2 text-xl font-bold">{heading}</h2>
				<p className="mb-6 text-gray-600">{message}</p>
				<div className="flex justify-between items-center">
					<LinkButton to={href("/dashboard")} variant={"outline"}>
						Dashboard
					</LinkButton>

					<Button
						onClick={refetch}
						className="button flex items-center gap-2">
						<RefreshCw className="h-4 w-4" />
						Try Again
					</Button>
				</div>
			</div>
		</div>
	);
}
