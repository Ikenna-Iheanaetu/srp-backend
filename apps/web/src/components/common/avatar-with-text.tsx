/** @format */

import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageOff } from "lucide-react";
import { TruncatedTextCell } from "./data-table/truncated-text-cell";
import { cn } from "@/lib/utils";

interface AvatarWithTextProps {
	src: string | undefined;
	alt?: string;
	text: string;
	fallback?: React.ReactNode;
	className?: string;
}

export function AvatarWithText({
	src,
	alt,
	text,
	fallback = <ImageOff />,
	className,
}: AvatarWithTextProps) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Avatar>
				<AvatarImage src={src} alt={alt} />
				<AvatarFallback>{fallback}</AvatarFallback>
			</Avatar>

			<TruncatedTextCell value={text} />
		</div>
	);
}
