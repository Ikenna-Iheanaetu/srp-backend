/** @format */

import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React, { FC } from "react";

export const AuthCard: FC<React.ComponentProps<typeof Card>> = ({
	className,
	...props
}) => (
	<Card
		{...props}
		className={cn(
			"absolute top-[10%] bottom-0 left-1/2 -translate-x-1/2  bg-opacity-70 flex flex-col items-center w-[80%] overflow-auto tw-scrollbar @sm:p-8 lg:max-w-[500px]",
			"min-h-[680px]:bottom-[5dvh] min-h-[750px]:bottom-[10dvh] min-h-[850px]:bottom-[15dvh]",
			className
		)}
	/>
);

export const AuthCardHeader: FC<React.ComponentProps<typeof CardHeader>> = ({
	className,
	...props
}) => (
	<CardHeader
		{...props}
		className={cn(
			"text-left w-full md:text-center lg:text-left h-xs:py-2 h-sm:py-2",
			className
		)}
	/>
);
