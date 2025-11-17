/** @format */

import UserComponentByType, {
	LazyLoadedUserComponents,
} from "@/components/common/render-user-component-by-type";
import React, { FC } from "react";
import "./utils/style.css";

// All users components will be lazy imported
const CompanyDashboard = React.lazy(() => import("./company"));
const PlayerDashboard = React.lazy(() => import("./player"));
const ClubDashboard = React.lazy(() => import("./club"));
const AdminDashboard = React.lazy(() => import("./admin"));
const componentsMap = {
	company: CompanyDashboard,
	player: PlayerDashboard,
	supporter: PlayerDashboard,
	club: ClubDashboard,
	admin: AdminDashboard,
} satisfies LazyLoadedUserComponents;

const DashboardRoute: FC = () => {
	return <UserComponentByType componentsMap={componentsMap} />;
};

export default DashboardRoute;
