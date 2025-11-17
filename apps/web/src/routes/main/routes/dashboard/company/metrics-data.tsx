/** @format */

import { CardActionsMenuProps } from "@/components/common/card-actions-menu";
import { LayersMetricsCard } from "@/components/common/metrics-card";
import { cn } from "@/lib/utils";
import { href, Link } from "react-router";
import { MetricsCardData } from "../components/metrics-card";

export type AccessorKey = "jobsPosting" | "newApplicants";

const bgColors = {
	jobsPosting: "bg-green-50",
	newApplicants: "bg-red-50",
} as const satisfies Record<AccessorKey, `bg-${string}`>;

const cardActionMenuItems = {
	jobsPosting: [
		<Link key={0} to={href("/job-management/posted")}>
			View Job Posts
		</Link>,
	],
	newApplicants: [
		<Link key={1} to={href("/job-management/posted")}>
			Job posts
		</Link>,
	],
} satisfies Record<AccessorKey, CardActionsMenuProps["items"]>;

export type CompanyMetricsData = MetricsCardData & {
	accessorKey: AccessorKey;
	value: number;
};

export interface MetricsDataMapperProps {
	metricsData: CompanyMetricsData[];
	className?: string;
}

export const MetricsDataMapper = ({
	metricsData,
	className,
}: MetricsDataMapperProps) => {
	return (
		<div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
			{metricsData.map(({ accessorKey, title, value }) => {
				return (
					<LayersMetricsCard
						key={accessorKey}
						title={title}
						value={value}
						actionMenuItems={cardActionMenuItems[accessorKey]}
						classNames={{
							root: bgColors[accessorKey],
						}}
					/>
				);
			})}
		</div>
	);
};
