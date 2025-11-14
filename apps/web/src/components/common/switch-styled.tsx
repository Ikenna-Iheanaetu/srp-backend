/** @format */

import { SwitchProps } from "@radix-ui/react-switch";
import { FC } from "react";
import { Switch } from "../ui/switch";
import { cn } from "@/lib/utils";

export const SwitchStyled: FC<SwitchProps> = ({ className, ...props }) => {
	return (
		<Switch
			{...props}
			className={cn("data-[state=checked]:bg-blue-700", className)}
		/>
	);
};
