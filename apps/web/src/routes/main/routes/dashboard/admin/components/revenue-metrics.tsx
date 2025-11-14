/** @format */

import { LayersMetricsCard } from "@/components/common/metrics-card";
import { formatCurrency } from "@/lib/helper-functions";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

interface RevenueMetricsProps {
	totalRevenue: number;
	totalInvoiced: number;
}

export function RevenueMetrics({
	totalRevenue,
	totalInvoiced,
}: RevenueMetricsProps) {
	const navigate = useNavigate();

	const cardActionMenuItems = {
		totalRevenue: [
			<Button
				key={0}
				variant="outline"
				className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
				onClick={() => {
					void navigate('/invoice-management/company');
				}}>
				Show Invoices
			</Button>
		]
	}

	return (
		<div className="space-y-4 my-4 md:my-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
			<LayersMetricsCard
				title="Total Revenue from Hiring"
				value={formatCurrency(totalRevenue)}
				classNames={{
					root: "bg-white border border-gray-200 shadow-none",
					icon: "color-gray-600",
				}}
				// actionMenuItems={cardActionMenuItems.totalRevenue}
				// renderActionsDirectly={false}
			/>
			<div className="bg-white">
				<LayersMetricsCard
					title="Total amount invoiced out"
					value={formatCurrency(totalInvoiced)}
					classNames={{
						root: "bg-white border border-gray-200 shadow-none",
						icon: "color-gray-600"
					}}
					actionMenuItems={cardActionMenuItems.totalRevenue}
					renderActionsDirectly={true}
				/>
			</div>
			</div>
		</div>
	);
}
