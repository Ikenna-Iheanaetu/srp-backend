/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { cn } from "@/lib/utils";
import { OptionalKeys, Prettify, RequireKeys } from "@/types";
import React from "react";
import { href } from "react-router";

type AddItemLinkProps = Prettify<
	RequireKeys<
		OptionalKeys<React.ComponentProps<typeof LinkButton>, "to">,
		"children"
	>
> & {
	isEntityView?: boolean;
};

/**If the `to` is omitted, this by default directs to "/settings/profile" */
export const AddItemLink: React.FC<AddItemLinkProps> = ({
	className,
	isEntityView = false,
	...props
}) =>
	!isEntityView && (
		<LinkButton
			variant={"link"}
			prefetch="viewport"
			to={href("/settings/profile")}
			{...props}
			className={cn("px-0 lowercase", className)}
		/>
	);
