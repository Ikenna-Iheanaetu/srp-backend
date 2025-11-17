/** @format */

import { cn } from "@/lib/utils";
import React from "react";
import LoadingIndicator from "./loading-indicator";

interface ContentFallbackProps {
	children: React.ReactNode;

	fallback?: React.ReactNode;

	hasContent?: boolean | ((children: React.ReactNode) => boolean);

	className?: string;
	/**
	 * Additional class names for the fallback
	 */
	fallbackClassName?: string;
	/**
	 * Whether to show a loading spinner in the fallback
	 */
	showLoading?: boolean;
}

/**
 * A component that renders fallback content when the main content doesn't exist
 */
export function ContentFallback({
	children,
	fallback,
	hasContent: hasContentProp,
	className,
	fallbackClassName,
	showLoading = false,
}: ContentFallbackProps) {
	// Determine if content exists
	const hasContent = React.useMemo(() => {
		// If hasContent is explicitly provided as a boolean, use it
		if (typeof hasContentProp === "boolean") {
			return hasContentProp;
		}

		// If hasContent is a function, call it with children
		if (typeof hasContentProp === "function") {
			return hasContentProp(children);
		}

		// Default check for empty content
		if (children === null || children === undefined) return false;
		if (children === "") return false;
		if (Array.isArray(children) && children.length === 0) return false;

		return true;
	}, [children, hasContentProp]);

	// Default fallback with optional loading spinner
	const defaultFallback = (
		<div
			className={cn(
				"text-muted-foreground text-sm flex items-center gap-2",
				fallbackClassName
			)}>
			{showLoading && <LoadingIndicator />}
			<span>No content available</span>
		</div>
	);

	return (
		<div className={className}>
			{hasContent ? children : (fallback ?? defaultFallback)}
		</div>
	);
}
