/** @format */

import { cn } from "@/lib/utils";
import React, { useMemo } from "react";

interface TruncatedNumberCellProps {
	value: number;
	className?: string;
}

/**Truncates a number text cell by formatting to compact notation (e.g., 1.2M, 1.2B).
 *
 * Full number is shown on hover.
 */
export const TruncatedNumberCell: React.FC<TruncatedNumberCellProps> = ({
	value,
	className,
}) => {
	// Format number with compact notation (e.g., 1.2M, 1.2B)
	const formattedValue = useMemo(
		() =>
			new Intl.NumberFormat("en-US", {
				notation: "compact",
				maximumFractionDigits: 2,
			}).format(value),
		[value]
	);

	// Full number for tooltip with maximum precision
	const fullValue = useMemo(
		() =>
			value?.toLocaleString("en-US", {
				maximumFractionDigits: 20,
			}),
		[value]
	);

	return (
		<div
			className={cn("w-max max-w-28 truncate text-right", className)}
			title={fullValue} // Shows full number on hover
		>
			{formattedValue}
		</div>
	);
};
