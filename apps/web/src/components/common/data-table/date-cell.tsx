/** @format */

import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React from "react";

interface Props {
	date: string;
	/**
	 * Get the formatted date according to the string of tokens passed in.
	 *
	 * To escape characters, wrap them in square brackets (e.g. [MM]).
	 * ```
	 * dayjs().format()// => current date in ISO8601, without fraction seconds e.g. '2020-04-02T08:02:17-05:00'
	 * dayjs('2019-01-25').format('[YYYYescape] YYYY-MM-DDTHH:mm:ssZ[Z]')// 'YYYYescape 2019-01-25T00:00:00-02:00Z'
	 * dayjs('2019-01-25').format('DD/MM/YYYY') // '25/01/2019'
	 * ```
	 * Docs: https://day.js.org/docs/en/display/format
	 */
	format?: string;
	className?: string;
}

export const TableDateCell: React.FC<Props> = ({ date, format, className }) => {
	return (
		<div className={cn("w-max", className)}>
			{dayjs(date).format(format ?? "YYYY-MM-DD")}
		</div>
	);
};
