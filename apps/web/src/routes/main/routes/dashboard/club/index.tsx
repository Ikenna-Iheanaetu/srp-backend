/** @format */
import { FC, useState } from "react";
import RequestsSent from "../../affiliate-management/club/sections/invites/route";
import DashboardCard, { MetricTitle } from "./components/dashboard-card";
import RevenueCard from "./components/revenue-card";
import { useFetchDashboardData } from "./use-fetch-dashboard-data";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectItem } from "@/components/ui/select";
import { SelectContent } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { TimePeriod } from "../query-factory";

export interface DashboardMetrics {
	title: MetricTitle;
	count: number;
	percentageChange: number;
	trendDirection: "up" | "down";
}

// interface DashboardData {
// 	revenue: number;
// 	metrics: DashboardMetrics[];
// 	applicants: Applicant[];
// }

interface BannerContainerProps {
	metrics: DashboardMetrics[];
	timePeriod: TimePeriod;
	onTimePeriodChange: (period: TimePeriod) => void;
}

const BannerContainer: FC<BannerContainerProps> = ({ metrics, timePeriod, onTimePeriodChange }) => {
	return (
		<div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-none">
			<div className="flex flex-col mb-6 sm:flex-row items-start sm:items-center justify-between gap-4">
				<Badge
					variant="plain"
					className="flex items-center gap-2 px-2.5 py-1.5 text-gray-600  text-sm md:text-base font-medium"
				>
					{/* <Clock className="h-4 w-4 md:h-5 md:w-5" /> */}
					<Clock className="text-gray-600" size={24} />

					Dashboard Overview
				</Badge>

				<Select
					value={timePeriod}
					onValueChange={(value: TimePeriod) => onTimePeriodChange(value)}>
					<SelectTrigger className="w-[60%] sm:w-[180px]">
						<SelectValue placeholder="Select period" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="today">Today</SelectItem>
						<SelectItem value="yesterday">Yesterday</SelectItem>
						<SelectItem value="last_week">Last Week</SelectItem>
						<SelectItem value="last_month">Last Month</SelectItem>
						<SelectItem value="last_year">Last Year</SelectItem>
					</SelectContent>
				</Select>
			</div>
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{metrics.map((metric) => (
				<DashboardCard
					key={metric.title}
					title={metric.title}
					count={metric.count}
					percentageChange={metric.percentageChange}
					trendDirection={metric.trendDirection}
				/>
			))}
		</div>
		</div>
	);
};

const ClubDashboard: FC = () => {
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("last_week");
	const { data } = useFetchDashboardData(timePeriod);

	return (
		data && (
			<div className="flex flex-col 	 gap-8 sm:gap-12">
				{/* date and action buttons row */}

				{/* hero section */}
				<section className="flex flex-col gap-4">
					<BannerContainer 
						metrics={data?.metrics} 
						timePeriod={timePeriod}
						onTimePeriodChange={setTimePeriod}
					/>
				</section>

				<div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-none grid grid-cols-1 xl:grid-cols-3 gap-8 sm:gap-12">
					{/* Revenue and Updates Section */}

					<RevenueCard />

					{/* Main Content Section */}
					<section className="xl:col-span-2 xl:order-1">
						<RequestsSent />
					</section>
				</div>
			</div>
		)
	);
};

export default ClubDashboard;
