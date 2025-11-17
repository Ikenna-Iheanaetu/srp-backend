/** @format */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Layers } from "lucide-react";
import type { FC, ReactNode } from "react";
import { Pie, PieChart } from "recharts";
import ActionsMenu from "./actions-menu";

dayjs.extend(relativeTime);

export interface ChartData {
	name: "scheduled" | "pending" | "completed";
	value: number;
}

export type MetricsType = "layers" | "pieChart" | "gradient";

// Base interface with common properties
interface BaseMetricsCardData<T extends MetricsType> {
	metricsType: T;
	title: string;
	value: number | string;
	trend: number;
}

// Specific interfaces for each metricsType
export type LayersMetricsCardData = BaseMetricsCardData<"layers">;

export interface PieChartMetricsCardData
	extends BaseMetricsCardData<"pieChart"> {
	chartData: ChartData[];
}

export interface GradientMetricsCardData
	extends BaseMetricsCardData<"gradient"> {
	updatedAt: string;
}

// Union of all variants
export type MetricsCardData =
	| LayersMetricsCardData
	| PieChartMetricsCardData
	| GradientMetricsCardData;

const chartFillColors = {
	scheduled: "hsl(210 100% 70%)",
	pending: "hsl(210 100% 85%)",
	completed: "hsl(210 100% 50%)",
} satisfies Record<ChartData["name"], string>;

const chartConfig = {
	complete: {
		label: "Complete",
		color: "hsl(246 83% 63%)",
	},
	remaining: {
		label: "Remaining",
		color: "hsl(246 83% 88%)",
	},
};

type Props = MetricsCardData & {
	actionMenuItems?: ReactNode[];
	className?: string;
};

export const MetricsCard: FC<Props> = (props) => {
	const { metricsType, title, value, trend, actionMenuItems, className } =
		props;

	return (
		<Card
			className={cn(
				"grid grid-cols-3 grid-rows-[auto_1fr] min-h-[160px] relative",
				"elevated-on-hover",
				className
			)}
			style={{
				background:
					metricsType === "gradient"
						? "linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%)"
						: undefined,
			}}>
			<CardHeader
				className={cn(
					"flex flex-row justify-start items-center gap-4 py-4",
					"col-span-3",
					metricsType === "gradient" && "text-white"
				)}>
				{metricsType === "layers" ? (
					<Layers className="text-gray-600" />
				) : metricsType === "gradient" ? (
					<Layers className="text-white" />
				) : null}
				<span
					className={cn(
						"font-semibold capitalize text-base text-gray-800",
						metricsType === "gradient" && "text-white"
					)}>
					{title}
				</span>
			</CardHeader>

			<CardContent
				className={cn(
					"col-span-2 py-2 px-6",
					metricsType === "layers" || metricsType === "gradient"
						? "flex flex-col justify-center items-start"
						: "flex items-center gap-6"
				)}>
				{metricsType === "pieChart" && props.chartData && (
					<ChartContainer config={chartConfig} className="w-24 h-24">
						<PieChart>
							<Pie
								data={props.chartData.map((data) => ({
									...data,
									fill: chartFillColors[data.name],
								}))}
								dataKey="value"
								nameKey="name"
								innerRadius={32}
								outerRadius={48}
								startAngle={90}
								endAngle={-270}
								fill="var(--color-complete)"
							/>
							<ChartTooltip
								content={<ChartTooltipContent />}
								cursor={false}
							/>
						</PieChart>
					</ChartContainer>
				)}
				<strong
					className={cn(
						"text-5xl font-bold text-gray-900",
						metricsType === "gradient" && "text-white"
					)}>
					{value}
				</strong>
				{metricsType === "gradient" && (
					<div className="text-lime-400 font-medium mt-1">
						+{trend}% from {dayjs(props.updatedAt).fromNow()}
					</div>
				)}
				{actionMenuItems && <ActionsMenu items={actionMenuItems} />}
			</CardContent>
		</Card>
	);
};
