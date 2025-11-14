/** @format */

import { InvitedAffiliatesDataTable } from "./data-table";

export default function AdminAffiliatesManagement() {
	

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Invited Affiliates</h1>
			<p>
				This table holds data for affiliated players, supporters, and
				companies invited by your club. Invites are either pending or
				accepted (active).
			</p>

			<InvitedAffiliatesDataTable />
		</div>
	);
}
