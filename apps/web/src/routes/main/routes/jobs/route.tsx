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
	if (pathname === href("/jobs")) {
		return redirect(href("/jobs/search"));
	}
};

const tabs = [
	{
		path: href("/jobs/search"),
		label: "Jobs",
	},
	{
		path: href("/jobs/companies"),
		label: "Companies",
	},
	{
		path: href("/jobs/tracking"),
		label: "Jobs Tracking",
	},
] satisfies TabRouteItem[];

const JobsLayoutRoute: FC = () => {
	return <TabPanelsNavigation tabs={tabs} />;
};

export default JobsLayoutRoute;
