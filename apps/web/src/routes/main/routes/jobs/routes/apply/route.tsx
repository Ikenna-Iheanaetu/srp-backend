/** @format */

import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { FC } from "react";
import PlayerJobApplicationForm from "./player/components/form";
import { HeroSummaryBanner } from "./player/components/hero-summary-banner";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: ["player", "supporter"],
	});
};

const JobApplicationRoute: FC = () => {
	return (
		<div className="flex flex-col gap-8">
			<HeroSummaryBanner />
			<PlayerJobApplicationForm />
		</div>
	);
};

export default JobApplicationRoute;
