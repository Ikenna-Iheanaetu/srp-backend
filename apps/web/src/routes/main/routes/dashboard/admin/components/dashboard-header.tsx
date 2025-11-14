/** @format */

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { TimePeriod } from "../query-factory";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
	timePeriod: TimePeriod;
	onTimePeriodChange: (period: TimePeriod) => void;
}

export function DashboardHeader({
	timePeriod,
	onTimePeriodChange,
}: DashboardHeaderProps) {
	return (
		<div className="space-y-4">
			<h2 className="text-base md:text-2xl font-normal md:font-semibold">Welcome to your Dashboard</h2>

			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<Badge
					variant="secondary"
					className="flex items-center gap-2 px-2.5 py-1.5 text-gray-600 bg-gray-100 rounded-full text-sm md:text-base font-medium hover:bg-gray-200 border border-gray-200"
				>
					<Clock className="h-4 w-4 md:h-5 md:w-5" />
					Dashboard Overview
				</Badge>

				<Select
					value={timePeriod}
					onValueChange={(value) =>
						onTimePeriodChange(value as TimePeriod)
					}>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Select period" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="today">Today</SelectItem>
						<SelectItem value="last_week">Last Week</SelectItem>
						<SelectItem value="last_month">Last Month</SelectItem>
						<SelectItem value="last_year">Last Year</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
