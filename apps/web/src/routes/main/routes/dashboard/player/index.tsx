/** @format */

import { LinkButton } from "@/components/common/link-btn";
import PlayerMainNavTabs from "@/components/common/user-type/player/player-main-nav-tabs";
import { FC } from "react";
import { href } from "react-router";
import GeneralNewNotifications from "../components/general-notifications";
import HeroBanner from "./hero-banner";
import { JobsTrackingTable } from "./new-jobs-table/data-table";
import { usePlayerDasboardData } from "./use-dashboard-data";

const PlayerDashboard: FC = () => {
	const { data } = usePlayerDasboardData();
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 bg-white">
				<PlayerMainNavTabs className="static" />

				<LinkButton
					className="w-fit self-end button"
					to={href("/jobs/search")}>
					Search jobs
				</LinkButton>
			</div>

			<HeroBanner recommendations={data?.recommendations ?? 0} />

			<section className="flex flex-col justify-between gap-4 *:flex-1 lg:flex-row">
				<JobsTrackingTable />
				<GeneralNewNotifications />
			</section>
		</div>
	);
};

export default PlayerDashboard;
