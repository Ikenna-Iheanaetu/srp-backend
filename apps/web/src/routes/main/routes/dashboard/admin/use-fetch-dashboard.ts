/** @format */

import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "../query-factory";
import { NewClub } from "./new-clubs-table/columns";
import { NewCompany } from "./new-companies-table/columns";

export interface AdminDashboardData {
	companies: NewCompany[];
	clubs: NewClub[];
}

export const useFetchDashboard = () =>
	useQuery(dashboardQueries.byUserType("admin"));
