/** @format */

import { UnclaimedInvitesDataTable } from "./data-table";

export default function InvitesToApprove() {
	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">
				Unclaimed invites (from Admin)
			</h1>
			<p>
				This table holds data for companies or clubs directly invited by
				the Admin, but still pending to sign up with their given ref
				codes.
			</p>

			<UnclaimedInvitesDataTable />
		</div>
	);
}
