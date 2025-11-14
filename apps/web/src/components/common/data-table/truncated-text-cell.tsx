/** @format */

import { cn } from "@/lib/utils";
import React from "react";

interface TruncatedTextCellProps {
	value: string;
	className?: string;
}

/**Truncates text in a cell to avoid overflow when too low.
 *
 * Full text is shown on hover.
 */
export const TruncatedTextCell: React.FC<TruncatedTextCellProps> = ({
	value,
	className,
}) => {
	return (
		<div
			className={cn("w-max max-w-28 truncate", className)}
			title={value} // Shows full text on hover
		>
			{value}
		</div>
	);
};
