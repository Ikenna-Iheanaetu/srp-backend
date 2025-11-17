/** @format */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RevenueMetrics } from "./components/revenue-metrics";
import { StatCards } from "./components/stat-cards";
import { HireHistoryTable } from "./components/hire-history/data-table";
import { NewCompaniesTable } from "./components/new-companies/data-table";
import { adminDashboardQueries, TimePeriod } from "./query-factory";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Select, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectContent } from "@/components/ui/select";
// import { Clock } from "lucide-react";

const AdminDashboard = () => {
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("last_week");

	const { data, isLoading } = useQuery(
		adminDashboardQueries.overview(timePeriod)
	);

	if (isLoading || !data) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<LoadingIndicator />
			</div>
		);
	}

	const { metrics, hireHistory, newCompanies } = data;

	return (
		<div className="space-y-4 md:space-y-8 bg-[#F1F5F9] -m-4 sm:-m-8 p-4 sm:p-8 min-h-screen">
			<h1 className="text-base md:text-2xl font-normal md:font-semibold">Welcome to your Dashboard</h1>
			<div className="bg-[#FFFFFF] rounded-lg p-4 md:p-6">
				<div className="flex items-center justify-between gap-2 md:gap-4">
					<div className="flex items-center p-1.5 md:p-2 bg-[#F8FAFC] rounded-full gap-1.5 md:gap-2 text-gray-600">
						{/* <Clock className="h-4 w-4 md:h-5 md:w-5" /> */}
						<svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 21C7.0293 21 3 16.9707 3 12C3 7.9698 5.6487 4.5588 9.3 3.4122V5.3238C7.75283 5.95204 6.47202 7.09834 5.67665 8.5666C4.88129 10.0349 4.62079 11.7339 4.93973 13.373C5.25866 15.0121 6.13721 16.4895 7.42509 17.5524C8.71297 18.6153 10.3301 19.1977 12 19.2C13.4344 19.2 14.8361 18.7716 16.0256 17.9699C17.215 17.1682 18.138 16.0296 18.6762 14.7H20.5878C19.4412 18.3513 16.0302 21 12 21ZM20.955 12.9H11.1V3.045C11.3961 3.0153 11.6967 3 12 3C16.9707 3 21 7.0293 21 12C21 12.3033 20.9847 12.6039 20.955 12.9ZM12.9 4.8558V11.1H19.1442C18.9439 9.51385 18.2216 8.0394 17.0911 6.90891C15.9606 5.77842 14.4862 5.05613 12.9 4.8558Z" fill="#64748B" />
						</svg>

						<span className="text-xs md:text-sm lg:text-base font-medium whitespace-nowrap">Dashboard Overview</span>
					</div>

					<Select
						value={timePeriod}
						onValueChange={(value) =>
							setTimePeriod(value as TimePeriod)
						}>
						<SelectTrigger className="w-[100px] md:w-[125px] rounded-lg text-xs md:text-sm">
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

				<RevenueMetrics
					totalRevenue={metrics.totalRevenueFromHiring}
					totalInvoiced={metrics.totalAmountInvoicedOut}
				/>

				<StatCards
					companySignup={metrics.totalCompanySignup}
					companyHires={metrics.totalCompanyHires}
					totalUsers={metrics.totalUsers}
				/>
			</div>

			<HireHistoryTable data={hireHistory} />

			<NewCompaniesTable data={newCompanies} />
		</div>
	);
};

export default AdminDashboard;