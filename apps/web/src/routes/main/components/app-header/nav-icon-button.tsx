/** @format */

import { LinkButton, LinkButtonProps } from "@/components/common/link-btn";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { FC } from "react";

interface Props extends LinkButtonProps {
	icon: LucideIcon;
}

export const NavIconButton: FC<Props> = ({
	icon: Icon,
	children,
	disableDefaultStyles = true,
	size = "icon",
	className,
	...props
}) => {
	return (
		<LinkButton
			{...props}
			size={size}
			className={cn("bg-white hover:bg-white group", className)}
			disableDefaultStyles={disableDefaultStyles}>
			<Icon className="group-hover:scale-125 transition-transform" />
			{children}
		</LinkButton>
	);
};
