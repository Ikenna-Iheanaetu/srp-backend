/** @format */

import SiteLogo from "@/components/common/site-logo";
import { cn } from "@/lib/utils";
import React, { FC } from "react";

export const AuthFormsLogo: FC<React.ComponentProps<typeof SiteLogo>> = ({
	classNames,
	...props
}) => (
	<SiteLogo
		{...props}
		classNames={{
			...classNames,
			root: cn(
				"absolute top-[5%] left-[40%] md:left-[25%] -translate-x-1/2 -translate-y-1/2",
				classNames?.root
			),
			logoText: cn("lg:!bg-none lg:text-white", classNames?.logoText),
		}}
	/>
);
