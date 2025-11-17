/** @format */

import TabPanelsNavigationMapper from "@/components/common/tab-panels-navigation-mapper";
import { useLocation } from "react-router";
import { lazy } from "react";

const Preview = lazy(() => import("./sections/preview"));
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import NewJob from "./sections/new-job";
// import JobPosted from "./sections/job-posted";
const AffiliateManagementTabs = () => {
	const { pathname } = useLocation();
	const isPreviewRoute = pathname == "/affiliate-management/new/preview";
	const routesMap = [
		{ route: "search", label: "Search and Filter" },
		{ route: "saved", label: "Saved" },
		{ route: "invites", label: "Invites" },
	];

	return (
		<>
			{isPreviewRoute ? (
				<Preview />
			) : (
				<TabPanelsNavigationMapper
					routesMap={routesMap}
					rootRoute="affiliate-management"
					indexRoute="search"
				/>
			)}
		</>
	);
};

export default AffiliateManagementTabs;
