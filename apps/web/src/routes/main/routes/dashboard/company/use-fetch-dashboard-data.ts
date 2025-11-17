/** @format */

import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "../query-factory";
import { AiMatchedApplicant } from "./ai-matched-applicants";
import { CompanyMetricsData } from "./metrics-data";
import { Applicant } from "./new-applicants-table/columns";
import { UserNotification } from "../../notifications/table/columns";

export interface CompanyDashboardData {
	pendingTasks: number;
	recruitmentGoals: {
		total: number;
		achieved: number;
	};
	metrics: CompanyMetricsData[];
	matches: AiMatchedApplicant[];
	notifications: UserNotification[];
	applicants: Applicant[];
}

export const useFetchDashboardData = () =>
	useQuery(dashboardQueries.byUserType("company"));
