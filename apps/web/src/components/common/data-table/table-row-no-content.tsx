/** @format */

import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import React, { FC } from "react";

interface Props extends React.ComponentProps<"tr"> {
	columnsLength: number;
	children: React.ReactNode;
}

export const TableRowNoContent: FC<Props> = ({
	columnsLength,
	className,
	children,
	...props
}) => {
	return (
		<TableRow {...props} className={cn(className)}>
			<TableCell
				colSpan={columnsLength}
				className={cn("h-24 text-center")}>
				{children}
			</TableCell>
		</TableRow>
	);
};
