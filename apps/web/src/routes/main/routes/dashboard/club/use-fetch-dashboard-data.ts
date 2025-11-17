/** @format */

import { useQuery } from "@tanstack/react-query";
import { Applicant } from "../company/new-applicants-table/columns";
import { dashboardQueries, TimePeriod } from "../query-factory";
import { DashboardMetrics } from ".";
import { UserNotification } from "../../notifications/table/columns";

interface TotalPlayers {
	count: number;
	percentageChange: number;
}

interface HiredPlayers {
	count: number;
	percentageChange: number;
}

interface Partners {
	count: number;
	percentageChange: number;
}

export interface ClubDashboardData {
	totalPlayers: TotalPlayers;
	hiredPlayers: HiredPlayers;
	partners: Partners;
	notifications: UserNotification[];
	applicants: Applicant[];
	revenue: number;
	paidOut: number;
	updates: string[];
	metrics: DashboardMetrics[];
}

export const useFetchDashboardData = (period?: TimePeriod) => {
	return useQuery(dashboardQueries.byUserType("club", period)) as {
		data: ClubDashboardData | undefined;
		isLoading: boolean;
		error: Error | null;
	};
};
