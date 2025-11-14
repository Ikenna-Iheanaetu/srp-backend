/** @format */

import React from "react";
import { Badge, BadgeProps } from "../ui/badge";
import { UserType } from "@/lib/schemas/user";
import { cn } from "@/lib/utils";

const colorStylesMap = {
	player: "bg-green-500",
	supporter: "bg-blue-500",
	company: "bg-purple-500",
	club: "bg-orange-500",
	admin: "bg-red-500",
} satisfies Record<UserType, `bg-${string}-500`>;

interface UserTypeBadgeProps extends SafeOmit<BadgeProps, "children"> {
	userType: UserType;
}

const UserTypeBadge: React.FC<UserTypeBadgeProps> = ({
	userType,
	...props
}) => {
	return (
		<Badge
			{...props}
			className={cn("capitalize", colorStylesMap[userType])}>
			{userType}
		</Badge>
	);
};

export { UserTypeBadge, colorStylesMap };
export type { UserTypeBadgeProps };
