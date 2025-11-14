/** @format */

import {
	TableSection,
	TableSectionContent,
	TableSectionDescription,
	TableSectionTitle,
} from "@/components/common/data-table/table-section";
import { FC } from "react";
import { ShortlistedJobsDataTable } from "./data-table";

const ShortlistedJobsRoute: FC = () => {
	return (
		<TableSection>
			<TableSectionTitle>
				Jobs with shortlisted candidates.
			</TableSectionTitle>

			<TableSectionDescription>
				This table holds data jobs your company has shortlisted players
				and/or supporters for.
			</TableSectionDescription>

			<TableSectionContent>
				<ShortlistedJobsDataTable />
			</TableSectionContent>
		</TableSection>
	);
};

export default ShortlistedJobsRoute;
