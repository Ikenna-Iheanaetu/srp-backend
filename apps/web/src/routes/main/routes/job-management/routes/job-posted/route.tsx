/** @format */

import {
	TableSectionContent,
	TableSectionDescription,
	TableSectionRoot,
	TableSectionTitle,
} from "@/components/common/data-table/table-section";
import { PostedJobsTable } from "./data-table";

export default function PostedJobsRoute() {
	return (
		<TableSectionRoot>
			<TableSectionTitle>Posted Jobs</TableSectionTitle>
			<TableSectionDescription>
				This table holds data for jobs posted by your company, whether
				active or in drafts.
			</TableSectionDescription>

			<TableSectionContent>
				<PostedJobsTable />
			</TableSectionContent>
		</TableSectionRoot>
	);
}
