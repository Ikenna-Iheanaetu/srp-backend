/** @format */

import { FC } from "react";
import { Button, ButtonProps } from "../ui/button";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends Omit<ButtonProps, "children"> {
	isBookmarked: boolean;
}

export const BookmarkButton: FC<Props> = ({
	isBookmarked,
	variant,
	size,
	className,
	...props
}) => {
	return (
		<Button
			{...props}
			type="button"
			variant={variant ?? "ghost"}
			size={size ?? "icon"}>
			<Bookmark
				className={cn(
					{
						"fill-blue-700 stroke-blue-700": isBookmarked,
					},
					className
				)}
			/>
		</Button>
	);
};
