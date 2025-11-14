/** @format */

import { DatePickerWithRange } from "@/components/common/date-range-picker";
import { subDays } from "date-fns";
import { FC, useState } from "react";
import { DateRange } from "react-day-picker";

const DataTimeRangePicker: FC = () => {
	// should be sent to backend to change dashboard data according to date range
	const [timeRange, setTimeRange] = useState<DateRange | undefined>({
		from: subDays(new Date(), 20),
		to: new Date(),
	});

	return (
		<DatePickerWithRange
			dateRange={timeRange}
			onDateChange={(date) => setTimeRange(date)}
			// restrict date range to today
			calendarDisabledOptions={{ after: new Date() }}
			placeholder="Select date range for dashboard"
		/>
	);
};

export default DataTimeRangePicker;
