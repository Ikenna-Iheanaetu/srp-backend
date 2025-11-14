/** @format */

import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { FC } from "react";
import PlayerJobsTrackingTable from "./player";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: ["player", "supporter"],
	});
};

const JobsTrackingRoute: FC = () => {
	return <PlayerJobsTrackingTable />;
};

export default JobsTrackingRoute;
