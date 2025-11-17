/** @format */

import {
	TableSection,
	TableSectionContent,
	TableSectionDescription,
	TableSectionTitle,
} from "@/components/common/data-table/table-section";
import { FC } from "react";
import { HiredJobsDataTable } from "./data-table";

const HiredJobsIndexRoute: FC = () => {
	return (
		<TableSection>
			<TableSectionTitle>
				Jobs your company has hired candidates for.
			</TableSectionTitle>

			<TableSectionDescription>
				This table holds data for jobs your company has hired players
				and/or supporters for.
			</TableSectionDescription>

			<TableSectionContent>
				<HiredJobsDataTable />
			</TableSectionContent>
		</TableSection>
	);
};

export default HiredJobsIndexRoute;
