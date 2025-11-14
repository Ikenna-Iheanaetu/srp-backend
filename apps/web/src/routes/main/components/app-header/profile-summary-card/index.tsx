/** @format */

import { FC } from "react";
import ProfileAccessDropdown from "./drop-down-menu";
import ProfileSummaryHoverCard from "./hover-card";

export const ProfileAccessSummaryCard: FC = () => {
	return (
		<div className="bg-white px-2 py-2 rounded-2xl shadow h-12 flex justify-between items-center gap-1">
			<ProfileAccessDropdown />
			<ProfileSummaryHoverCard />
		</div>
	);
};
