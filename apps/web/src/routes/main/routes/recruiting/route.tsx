/** @format */

import {
	TabPanelsNavigation,
	TabRouteItem,
} from "@/components/common/tab-panels";
import { FC } from "react";
import { href, redirect } from "react-router";
import { Route } from "./+types/route";

export const clientLoader = ({ request }: Route.ClientLoaderArgs) => {
	const { pathname } = new URL(request.url);
	if (pathname === href("/recruiting")) {
		return redirect(href("/recruiting/search"));
	}
};

const tabRoutes = [
	{
		path: href("/recruiting/search"),
		label: "Search and Filter",
	},
	{
		path: href("/recruiting/shortlisted"),
		label: "Shortlisted",
	},
	{
		path: href("/recruiting/hired"),
		label: "Hired",
	},
] satisfies TabRouteItem[];

const RecruitmentLayoutRoute: FC = () => {
	return <TabPanelsNavigation tabs={tabRoutes} />;
};

export default RecruitmentLayoutRoute;
