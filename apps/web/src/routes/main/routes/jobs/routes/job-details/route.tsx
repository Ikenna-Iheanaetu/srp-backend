/** @format */

import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { FC } from "react";
import PlayerJobDetails from "./player";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: ["player", "supporter"],
	}).redirect;
};

const JobDetailsRoute: FC = () => {
	return <PlayerJobDetails />;
};

export default JobDetailsRoute;
