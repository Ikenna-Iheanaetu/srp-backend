/** @format */

import React from "react";
import { Button } from "../ui/button";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
	flip: () => void;
	className?: string;
	/**Defaults to "front" */
	panel?: "front" | "back";
}

export const FlipButton: React.FC<Props> = ({
	flip,
	className,
	panel = "front",
}) => (
	<Button
		variant={"ghost"}
		size={"icon"}
		onClick={flip}
		className={cn(
			"border w-16 h-10 hover:bg-zinc-300 group",
			{
				"bg-blue-950": panel === "back",
			},
			className
		)}>
		<RotateCcw className="text-white group-hover:text-indigo-950 transition-colors" />
	</Button>
);
