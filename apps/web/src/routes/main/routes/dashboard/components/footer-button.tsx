/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { cn } from "@/lib/utils";
import React, { FC } from "react";

type Props = React.ComponentProps<typeof LinkButton>;

export const FooterButton: FC<Props> = ({ className, ...props }) => {
	return (
		<LinkButton
			variant={"link"}
			{...props}
			className={cn("w-fit text-blue-700 font-semibold", className)}
		/>
	);
};
