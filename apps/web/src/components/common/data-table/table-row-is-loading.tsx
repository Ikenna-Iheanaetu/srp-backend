/** @format */

import { TableCell, TableRow } from "@/components/ui/table";
import React, { FC } from "react";
import LoadingIndicator from "../loading-indicator";
import { cn } from "@/lib/utils";

interface Props extends React.ComponentProps<"tr"> {
	columnsLength: number;
}

export const TableRowIsLoading: FC<Props> = ({
	columnsLength,
	className,
	...props
}) => {
	return (
		<TableRow {...props} className={cn(className)}>
			<TableCell
				colSpan={columnsLength}
				className={cn("h-24 text-center")}>
				Loading... <LoadingIndicator />
			</TableCell>
		</TableRow>
	);
};
