/** @format */

import { InvitesApprovalDataTable } from "./data-table";

export default function InvitesToApprove() {
	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Invites awaiting approval</h1>
			<p>
				This table holds data for players, supporters, and companies
				affiliated by clubs but awaiting admin approval.
			</p>

			<InvitesApprovalDataTable />
		</div>
	);
}
