/** @format */

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { CardActionsMenu, CardActionsMenuProps } from "@/components/common/card-actions-menu";
import { Layers, User } from "lucide-react";

interface MetricsCardProps {
	className?: string;
	children: React.ReactNode;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ className, ...props }) => {
	return (
		<Card
			{...props}
			className={cn(
				"grid grid-cols-3 grid-rows-[auto_1fr] min-h-[160px] relative elevated-on-hover",
				className
			)}
		/>
	);
};

interface MetricsCardHeaderProps {
	title: React.ReactNode;
	icon?: React.ReactNode;
	className?: string;
}

const MetricsCardHeader: React.FC<MetricsCardHeaderProps> = ({
	title,
	icon,
	className,
}) => {
	return (
		<CardHeader
			className={cn(
				"flex flex-row justify-start items-center gap-4 pb-2",
				"col-span-3",
				className
			)}>
			{icon}
			<span
				className={cn(
					"font-normal capitalize text-sm md:text-base text-gray-800"
				)}>
				{title}
			</span>
		</CardHeader>
	);
};

interface MetricsCardContentProps {
	value: React.ReactNode;
	actionMenuItems?: CardActionsMenuProps["items"];
	className?: string;
	children?: React.ReactNode;
	/**
	 * If true, renders action items directly without dropdown menu
	 */
	renderActionsDirectly?: boolean;
}

const MetricsCardContent: React.FC<MetricsCardContentProps> = ({
	value,
	actionMenuItems,
	className,
	children,
	renderActionsDirectly = false,
}) => {
	return (
		<CardContent className={cn("col-span-2 py-2 px-6", className)}>
			<strong className={cn("text-3xl font-medium text-gray-900")}>
				{value}
			</strong>
			{children}
			{actionMenuItems && (
				<CardActionsMenu
					items={actionMenuItems}
					renderDirect={renderActionsDirectly}
				/>
			)}
		</CardContent>
	);
};

/* -------------------- Precise Metrics Cards ----------------------- */

interface MetricsClassNames {
	root: string;
	header: string;
	content: string;
	value: string;
	icon: string;
	title: string;
	trend: string;
}

interface CoupledMetricsCardProps {
	title: string;
	value: number | string;
	actionMenuItems?: CardActionsMenuProps["items"];
	classNames?: Partial<MetricsClassNames>;
	/**
	 * If true, renders action items directly without dropdown menu
	 */
	renderActionsDirectly?: boolean;
}

interface LayersMetricsClubCardProps extends CoupledMetricsCardProps {
	trend?: string | React.ReactNode;
	updatedAt?: string;
	icon?: React.ReactNode;
}

const LayersMetricsClubCard: React.FC<LayersMetricsClubCardProps> = ({
	title,
	value,
	trend,
	updatedAt,
	actionMenuItems,
	classNames,
	renderActionsDirectly,
	icon,
}) => {
	return (
		<MetricsCard className={classNames?.root}>
			<MetricsCardHeader
				title={<span className={classNames?.title}>{title}</span>}
				icon={
					icon || (
						<User className="text-gray-600" size={24} />
					)
				}
				className={classNames?.header}
			/>
			<MetricsCardContent
				value={<span className={classNames?.value}>{value}</span>}
				actionMenuItems={actionMenuItems}
				renderActionsDirectly={renderActionsDirectly}
				className={cn(
					"flex flex-col justify-center items-start",
					classNames?.content
				)}			>
				{trend && (
					<div
						className={cn(
							"text-green-600 font-medium mt-4 text-nowrap text-sm",
							classNames?.trend
						)}>
						{typeof trend === 'string' && updatedAt ? `${trend} from ${updatedAt}` : trend}
					</div>
				)}
			</MetricsCardContent>
		</MetricsCard>
	);
};

interface ChartData {
	name: "scheduled" | "pending" | "completed";
	value: number;
}

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

interface PieChartMetricsCardProps extends CoupledMetricsCardProps {
	chartData: ChartData[];
}

const PieChartMetricsCard: React.FC<PieChartMetricsCardProps> = ({
	title,
	value,
	chartData,
	actionMenuItems,
	classNames,
}) => {
	return (
		<MetricsCard className={classNames?.root}>
			<MetricsCardHeader
				title={<span className={classNames?.title}>{title}</span>}
				className={classNames?.header}
			/>
			<MetricsCardContent
				value={<span className={classNames?.value}>{value}</span>}
				actionMenuItems={actionMenuItems}
				className={cn("flex items-center gap-6", classNames?.content)}>
				<ChartContainer config={chartConfig} className="w-24 h-24">
					<PieChart>
						<Pie
							data={chartData.map((data) => ({
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
			</MetricsCardContent>
		</MetricsCard>
	);
};

interface GradientMetricsCardProps extends CoupledMetricsCardProps {
	trend: string;
	updatedAt: string;
}

const GradientMetricsCard: React.FC<GradientMetricsCardProps> = ({
	title,
	value,
	trend,
	updatedAt,
	actionMenuItems,
	classNames,
}) => {
	return (
		<MetricsCard
			className={cn(
				"[background:_linear-gradient(218.9deg,_#504AC2_3.19%,_#27245E_84.45%,_#26235C_102.22%)]",
				classNames?.root
			)}>
			<MetricsCardHeader
				title={
					<span className={cn("text-white", classNames?.title)}>
						{title}
					</span>
				}
				icon={
					<Layers className="text-white" size={24} />
				}
				className={cn("text-white", classNames?.header)}
			/>
			<MetricsCardContent
				value={
					<span className={cn("text-white", classNames?.value)}>
						{value}
					</span>
				}
				actionMenuItems={actionMenuItems}
				className={cn(
					"flex flex-col justify-center items-start",
					classNames?.content
				)}>
				<div
					className={cn(
						"text-lime-400 font-medium mt-1 text-nowrap",
						classNames?.trend
					)}>
					{trend} from {updatedAt}
				</div>
			</MetricsCardContent>
		</MetricsCard>
	);
};

export {
	MetricsCard,
	MetricsCardHeader,
	MetricsCardContent,
	LayersMetricsClubCard,
	PieChartMetricsCard,
	GradientMetricsCard,
};

export type {
	MetricsCardProps,
	MetricsCardHeaderProps,
	MetricsCardContentProps,
	LayersMetricsClubCardProps,
	PieChartMetricsCardProps,
	GradientMetricsCardProps,
};
