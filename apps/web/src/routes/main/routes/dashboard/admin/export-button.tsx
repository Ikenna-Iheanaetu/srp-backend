/** @format */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SafeOmit } from "@/types";
import React from "react";

type Props = SafeOmit<React.ComponentProps<typeof Button>, "asChild">;

export const ExportButton: React.FC<Props> = ({
	className,
	children = "Export",
	...props
}) => (
	<Button
		type="button"
		title="Export table data"
		disabled
		{...props}
		className={cn(
			"button px-10 border border-gray-200 !bg-white",
			className
		)}>
		{children}
	</Button>
);
