/** @format */

import {
	TableSectionContent,
	TableSectionDescription,
	TableSectionRoot,
	TableSectionTitle,
} from "@/components/common/data-table/table-section";
import { DraftedJobsTable } from "./data-table";

export default function DraftedJobsRoute() {
	return (
		<TableSectionRoot>
			<TableSectionTitle>Drafted Jobs</TableSectionTitle>
			<TableSectionDescription>
				This table holds data for jobs saved in drafts by your company,
				that has either been posted before or not.
			</TableSectionDescription>

			<TableSectionContent>
				<DraftedJobsTable />
			</TableSectionContent>
		</TableSectionRoot>
	);
}
