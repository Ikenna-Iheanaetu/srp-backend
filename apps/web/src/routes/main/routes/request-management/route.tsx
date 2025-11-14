/** @format */

import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { Outlet } from "react-router";

export const clientLoader = () => {
	return restrictRouteByUserType({ allowedUserTypes: ["admin"] }).redirect;
};

const RequestManagementLayoutRoute = () => {
	return (
		<div className="space-y-4 md:space-y-6 bg-[#F1F5F9] -m-4 sm:-m-8 p-4 sm:p-8 min-h-screen">
			<h1 className="text-base md:text-2xl font-normal md:font-semibold text-gray-900">
				Request
			</h1>
			<Outlet />
		</div>
	);
};

export default RequestManagementLayoutRoute;

