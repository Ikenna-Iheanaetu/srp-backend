/** @format */

import { ClubsDataTable } from "./components/clubs-table/data-table";
import { InviteClubDialog } from "./components/invite-club-dialog";

const ClubManagementIndexRoute = () => {
	return (
		<div className="space-y-4">
			<InviteClubDialog />
			<ClubsDataTable />
		</div>
	);
};

export default ClubManagementIndexRoute;
