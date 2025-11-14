/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { UserType } from "@/lib/schemas/user";
import { MapUserTypeToValue } from "@/types";
import { queryOptions } from "@tanstack/react-query";
import { AdminDashboardData } from "./admin/use-fetch-dashboard";
import { CompanyDashboardData } from "./company/use-fetch-dashboard-data";
import { PlayerDashboardData } from "./player/use-dashboard-data";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

export type TimePeriod = "today" | "yesterday" | "last_week" | "last_month" | "last_year";

interface UserDashboardData {
	player: PlayerDashboardData;
	supporter: PlayerDashboardData;
	company: CompanyDashboardData;
	admin: AdminDashboardData;
}

const fetchDashboardData = async <TUserType extends UserType>(period?: TimePeriod) => {
	const params = period ? { period } : {};
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{
			hasData: true;
			data: MapUserTypeToValue<UserDashboardData, TUserType>;
		}>
	>("/dashboard", { params });

	return response.data.data;
};

export const dashboardQueries = {
	all: () => ["user-dashboard"] as const,
	byUserType: <TUserType extends UserType>(userType: TUserType, period?: TimePeriod) =>
		queryOptions({
			queryKey: [...dashboardQueries.all(), userType, period] as const,
			queryFn: () => fetchDashboardData<TUserType>(period),
		}),
};
