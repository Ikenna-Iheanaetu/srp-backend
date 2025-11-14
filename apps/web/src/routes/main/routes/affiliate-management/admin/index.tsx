/** @format */

import { AffiliatesDataTable } from "./data-table";

export default function AdminAffiliatesManagement() {
	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Affiliates</h1>
			<p>
				This table holds data for players and supporters affiliated by
				clubs.
			</p>

			<AffiliatesDataTable />
		</div>
	);
}
