/** @format */

import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "../query-factory";

export interface PlayerDashboardData {
	recommendations: number;
}

export const usePlayerDasboardData = () => {
	return useQuery(dashboardQueries.byUserType("player"));
};
