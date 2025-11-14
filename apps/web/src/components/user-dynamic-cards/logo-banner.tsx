/** @format */

import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ImageOff } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface LogoBannerProps {
	logo: string | undefined;
	altText?: string;
	className?: string;
}

export const LogoBanner: React.FC<LogoBannerProps> = ({
	logo,
	className,
	altText = "logo banner",
}) => (
	<Avatar
		className={cn(
			"w-40 h-24 aspect-square rounded-sm col-span-3",
			className
		)}>
		<AvatarImage
			src={getFileNameUrl(logo)}
			className="object-contain"
			alt={altText}
		/>
		<AvatarFallback className="rounded-sm">
			<ImageOff />
		</AvatarFallback>
	</Avatar>
);
