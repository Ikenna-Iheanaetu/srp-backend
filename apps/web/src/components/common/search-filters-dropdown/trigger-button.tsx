/** @format */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SafeOmit } from "@/types";
import { ChevronDown } from "lucide-react";
import React from "react";

export interface TriggerButtonLabels<TKey extends string = string> {
	hanging: string;
	button: TKey;
	menu: string;
}

interface Props<TKey extends string = string>
	extends SafeOmit<
		React.ComponentProps<typeof Button>,
		"children" | "asChild" | "variant"
	> {
	labels: TriggerButtonLabels<TKey>;
}

export const TriggerButton = <TKey extends string = string>({
	labels,
	className,
	...props
}: Props<TKey>) => {
	return (
		<Button
			{...props}
			variant="outline"
			className={cn(
				"relative py-5 border-black rounded-lg ring-0 gap-4 capitalize group",
				className
			)}>
			<div className="absolute top-0 left-4 -translate-y-1/2 bg-white group-hover:invisible px-2 py-1">
				{labels.hanging}
			</div>
			<span>{labels.button}</span>{" "}
			<ChevronDown className="group-data-[state=open]:rotate-180 transition-transform" />
		</Button>
	);
};
