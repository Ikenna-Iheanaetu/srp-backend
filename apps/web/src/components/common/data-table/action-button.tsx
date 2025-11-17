/** @format */

// prettier-ignore
/* eslint-disable @typescript-eslint/unbound-method */

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FC } from "react";
import plugin from "tailwindcss/plugin";

// This tailwind plugin is defined here for colocation of logic
/**
 * Tailwind plugin to generate `table-action-${color}` utilities.
 * Applies `bg-${color}-100 text-${color}-500` for any Tailwind color.
 */
const tableActionPlugin = plugin(({ matchUtilities, theme }) => {
	matchUtilities(
		{
			"table-action": (value) => ({
				backgroundColor: theme(`colors.${value}.100`),
				color: theme(`colors.${value}.500`),
			}),
		},
		{
			values: Object.keys(theme("colors")).reduce(
				(acc, color) => {
					if (typeof theme(`colors.${color}`) === "object") {
						acc[color] = color;
					}
					return acc;
				},
				{} as Record<string, string>
			),
			type: "color",
		}
	);
});

interface Props extends ButtonProps {
	/**The class utility `table-action-${color}` is required for styling the button */
	className: `${string}table-action-${string}`;
}

const TableActionButton: FC<Props> = ({ className, ...rest }) => {
	return <Button {...rest} className={cn(className)} />;
};

export { TableActionButton, tableActionPlugin };
