/** @format */

import { FC } from "react";
import { Checkbox } from "../ui/checkbox";
import { CheckboxProps } from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

export const CheckboxStyled: FC<CheckboxProps> = ({ className, ...props }) => {
	return (
		<Checkbox
			{...props}
			className={cn(
				"data-[state=checked]:bg-blue-700 [&_svg]:data-[state=checked]:stroke-white data-[state=checked]:border-none",
				className
			)}
		/>
	);
};
