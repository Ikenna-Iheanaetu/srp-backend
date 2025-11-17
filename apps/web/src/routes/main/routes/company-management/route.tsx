/** @format */

import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { Outlet } from "react-router";

export const clientLoader = () => {
	return restrictRouteByUserType({ allowedUserTypes: ["admin"] }).redirect;
};

const CompanyManagementLayoutRoute = () => {
	return <Outlet />;
};

export default CompanyManagementLayoutRoute;
