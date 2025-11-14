/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { queryOptions } from "@tanstack/react-query";

export type TimePeriod = "today" | "yesterday" | "last_week" | "last_month" | "last_year";

export interface DashboardMetrics {
	totalRevenueFromHiring: number;
	totalAmountInvoicedOut: number;
	totalCompanySignup: {
		count: number;
		percentageChange: string;
	};
	totalCompanyHires: {
		count: number;
		percentageChange: string;
	};
	totalUsers: {
		count: number;
		percentageChange: string;
	};
}

export interface HireHistoryItem {
	id: string;
	name: string;
	companyName: string;
	club: string;
	clubAvatar?: string;
	invoiceId: string;
	amount: number;
	dateTime: string;
}

export interface NewCompanyItem {
	id: string;
	name: string;
	industry: string;
	status: "pending" | "approved" | "active" | "inactive" | "suspended";
	dateTime: string;
}

export interface AdminDashboardData {
	metrics: DashboardMetrics;
	hireHistory: HireHistoryItem[];
	newCompanies: NewCompanyItem[];
}

// Backend response types
interface MetricData {
	current: number;
	previous: number;
	percentageChange: number;
}

interface DashboardMetricsData {
	totalRevenue: MetricData;
	totalInvoiced: MetricData;
	companySignups: MetricData;
	companyHires: MetricData;
	totalUsers: MetricData;
}

interface HireHistoryItemResponse {
	id: string;
	playerName: string;
	playerEmail: string;
	companyName: string;
	companyId: string;
	clubName: string;
	clubAvatar: string;
	clubId: string;
	invoiceCode: string;
	invoiceId: string;
	amount: number;
	hiredAt: string;
}

interface NewCompanyItemResponse {
	id: string;
	name: string;
	email: string;
	industry: string;
	status: string;
	signupDate: string;
}

interface CombinedDashboardData {
	metrics: DashboardMetricsData;
	hireHistory: HireHistoryItemResponse[];
	newCompanies: NewCompanyItemResponse[];
}

const formatPercentageChange = (value: number): string => {
	const formatted = value.toFixed(2);
	return value >= 0 ? `+${formatted}%` : `${formatted}%`;
};

const fetchAdminDashboardData = async (
	period: TimePeriod
): Promise<AdminDashboardData> => {
	try {
		// Use the combined endpoint
		const response = await apiAxiosInstance.get<
			ApiSuccessResponse<{ hasData: true; data: CombinedDashboardData }>
		>("/admin/dashboard", {
			params: {
				period,
				hireHistoryPage: 1,
				hireHistoryLimit: 5,
				newCompaniesPage: 1,
				newCompaniesLimit: 2,
			},
		});

		const { metrics, hireHistory, newCompanies } = response.data.data;
		const hireHistoryData = hireHistory;
		const newCompaniesData = newCompanies;

		return {
			metrics: {
				totalRevenueFromHiring: metrics.totalRevenue.current,
				totalAmountInvoicedOut: metrics.totalInvoiced.current,
				totalCompanySignup: {
					count: metrics.companySignups.current,
					percentageChange: formatPercentageChange(
						metrics.companySignups.percentageChange
					),
				},
				totalCompanyHires: {
					count: metrics.companyHires.current,
					percentageChange: formatPercentageChange(
						metrics.companyHires.percentageChange
					),
				},
				totalUsers: {
					count: metrics.totalUsers.current,
					percentageChange: formatPercentageChange(
						metrics.totalUsers.percentageChange
					),
				},
			},
			hireHistory: hireHistoryData.map((item) => ({
				id: item.id,
				name: item.playerName,
				companyName: item.companyName,
				club: item.clubName,
				clubAvatar: item.clubAvatar,
				invoiceId: item.invoiceCode,
				amount: item.amount,
				dateTime: item.hiredAt,
			})),
			newCompanies: newCompaniesData.map((item) => ({
				id: item.id,
				name: item.name,
				industry: item.industry,
				status: item.status as NewCompanyItem["status"],
				dateTime: item.signupDate,
			})),
		};
	} catch (error) {
		console.error("Error fetching admin dashboard data:", error);
		// Fallback to dummy data in case of error
		throw error;
	}
};

export const adminDashboardQueries = {
	all: () => ["admin-dashboard"] as const,

	overview: (period: TimePeriod = "last_week") => {
		return queryOptions({
			queryKey: [...adminDashboardQueries.all(), "overview", period] as const,
			queryFn: () => fetchAdminDashboardData(period),
		});
	},
};
