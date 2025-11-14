/** @format */

import { cn } from "@/lib/utils";
import { Merge, SafeOmit } from "@/types";
import { FC } from "react";
import { Link, LinkProps } from "react-router";
import { Button, ButtonProps } from "../ui/button";

export interface LinkButtonProps
	extends Merge<SafeOmit<ButtonProps, "asChild">, LinkProps> {
	/**
	 * If true, prevents the application of specific default styles defined within this component.
	 * Defaults to false (styles are applied).
	 */
	disableDefaultStyles?: boolean;
	ref?: React.Ref<HTMLAnchorElement>;
}

/**
 * A React Router Link component styled to look and behave like a Shadcn Button.
 * Use the `variant` prop to control appearance based on Shadcn Button variants.
 * @param props Component props, including LinkProps and ButtonProps (excluding asChild).
 */
export const LinkButton: FC<LinkButtonProps> = ({
	variant = "default",
	disableDefaultStyles = false,
	className,
	...props
}) => {
	return (
		<Button
			asChild
			{...(props as ButtonProps)}
			variant={variant}
			className={cn(
				!disableDefaultStyles && {
					button: variant === "default",
					"button-secondary": variant === "secondary",
					"text-blue-700": variant === "link",
				},
				className,
			)}>
			<Link {...props} />
		</Button>
	);
};
