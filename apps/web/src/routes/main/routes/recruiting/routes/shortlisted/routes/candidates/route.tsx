/** @format */

import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { useParams } from "react-router";
import { ShortlistedCandidatesDataTable } from "./data-table";
import {
	TableSection,
	TableSectionContent,
	TableSectionDescription,
	TableSectionTitle,
} from "@/components/common/data-table/table-section";
import { jobsQueries } from "../../../../../jobs/query-factory";

const ShortlistedCandidatesRoute: FC = () => {
	const { id: jobId } = useParams<{ id: string }>();


	const { data: jobDetails } = useQuery({
		...jobsQueries.detail(jobId ?? ""),
		enabled: !!jobId,
	});

	const jobTitle = jobDetails?.title ?? "Loading...";

	return (
		<TableSection>
			<TableSectionTitle>
				Shortlisted candidates for job, {jobTitle}
			</TableSectionTitle>

			<TableSectionDescription>
				This table holds data for players and supporters who your
				company shortlisted for this job.
			</TableSectionDescription>

			<TableSectionContent>
				<ShortlistedCandidatesDataTable />
			</TableSectionContent>
		</TableSection>
	);
};

export default ShortlistedCandidatesRoute;
