/** @format */

import {
	TabPanelsNavigation,
	TabRouteItem,
} from "@/components/common/tab-panels";
import { href, redirect } from "react-router";
import { Route } from "./+types/route";

export const clientLoader = ({ request }: Route.ClientLoaderArgs) => {
	const { pathname } = new URL(request.url);
	if (pathname === href("/job-management")) {
		return redirect(href("/job-management/posted"));
	}
};

const tabsMap = [
	{ path: href("/job-management/posted"), label: "Jobs Posted" },
	{ path: href("/job-management/drafts"), label: "Jobs Drafted" },
	{ path: href("/job-management/new"), label: "New Job" },
] satisfies TabRouteItem[];

export default function JobManagementRoute() {
	return <TabPanelsNavigation tabs={tabsMap} />;
}
