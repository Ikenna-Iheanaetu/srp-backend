/** @format */

import { FC } from "react";
import PlayerJobSearch from "./player";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: ["player", "supporter"],
	}).redirect;
};

const JobsSearchRoute: FC = () => {
	return <PlayerJobSearch />;
};

export default JobsSearchRoute;
