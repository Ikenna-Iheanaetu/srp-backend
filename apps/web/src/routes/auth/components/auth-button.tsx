/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { SafeOmit } from "@/types";
import React, { FC } from "react";

interface AuthLinkButtonProps
	extends SafeOmit<
		React.ComponentProps<typeof LinkButton>,
		"variant" | "prefetch"
	> {
	children: React.ReactNode;
}

export const AuthLinkButton: FC<AuthLinkButtonProps> = ({ ...props }) => (
	<LinkButton {...props} variant={"link"} prefetch="render" />
);
