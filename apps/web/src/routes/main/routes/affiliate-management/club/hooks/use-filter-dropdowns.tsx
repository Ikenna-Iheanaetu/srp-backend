/** @format */

import { useCallback, useState } from "react";
import { TimeInterval } from "../utils/types";

// const getDateFromInterval = (interval: TimeInterval) => {
//   const now = new Date();
//   switch (interval) {
//     case "12 months":
//       return new Date(now.setMonth(now.getMonth() - 12));
//     case "30 days":
//       return new Date(now.setDate(now.getDate() - 30));
//     case "7 days":
//       return new Date(now.setDate(now.getDate() - 7));
//     case "24 hours":
//       return new Date(now.setHours(now.getHours() - 24));
//     default:
//       return new Date(0);
//   }
// };
export default function useFilterDropdowns<T extends { datePosted: string }>(
	data: T[]
) {
	const [statusFilter, setStatusFilter] = useState("all");

	const [timeInterval, setTimeInterval] = useState<TimeInterval>("12 months");
	// const [priorities, setPriorities] = useState();

	const handleTimeIntervalChange = useCallback((value: string) => {
		setTimeInterval(value as TimeInterval);
	}, []);
	const handleStatusFilterChange = useCallback((value: string) => {
		setStatusFilter(value);
	}, []);
	return {
		timeInterval,
		statusFilter,
		handleTimeIntervalChange,
		handleStatusFilterChange,
		filteredData: data,
	};
}
