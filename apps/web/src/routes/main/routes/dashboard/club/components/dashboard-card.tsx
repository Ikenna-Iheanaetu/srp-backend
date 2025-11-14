/** @format */

import { LayersMetricsClubCard } from "./club-metrics-card";

export type MetricTitle = "Total Players" | "Hired Players" | "Total Partners";

export interface DashboardCardProps {
	title: MetricTitle;
	count: number;
	percentageChange?: number;
	trendDirection?: "up" | "down";
	className?: string;
}

export default function DashboardCard({
	title,
	count,
	percentageChange,
	trendDirection,
}: DashboardCardProps) {
	// Format the trend string
	const trend = percentageChange !== undefined
		? `${trendDirection === "up" ? "+" : ""}${percentageChange}%`
		: undefined;

	return (
		<LayersMetricsClubCard
			title={title}
			value={count}
			trend={trend}
			updatedAt="yesterday"
			classNames={{
				root: "bg-[#F8FAFC] shadow-none",
				icon: "text-gray-600",
			}}
		/>
	);
}
