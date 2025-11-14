/** @format */

import { CompanyInviteDialog } from "./components/invite-company-dialog";
import { CompaniesDataTable } from "./components/table/data-table";

const CompanyManagementIndexRoute = () => {
	return (
		<div className="space-y-16">
			<CompanyInviteDialog />

			<CompaniesDataTable />
		</div>
	);
};

export default CompanyManagementIndexRoute;
