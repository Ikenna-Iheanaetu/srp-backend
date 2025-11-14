/** @format */

import {
	TableSection,
	TableSectionContent,
	TableSectionDescription,
	TableSectionTitle,
} from "@/components/common/data-table/table-section";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { useParams } from "react-router";
import { HiredCandidatesDataTable } from "./data-table";
import { jobsQueries } from "../../../../../jobs/query-factory";

const HiredCandidatesRoute: FC = () => {
	const { id: jobId } = useParams<{ id: string }>();


	const { data: jobDetails } = useQuery({
		...jobsQueries.detail(jobId ?? ""),
		enabled: !!jobId,
	});

	const jobTitle = jobDetails?.title ?? "Loading...";

	return (
		<TableSection>
			<TableSectionTitle>
				Hired candidates for job, {jobTitle}
			</TableSectionTitle>

			<TableSectionDescription>
				This table holds data for players and supporters who your
				company hired for this job.
			</TableSectionDescription>

			<TableSectionContent>
				<HiredCandidatesDataTable />
			</TableSectionContent>
		</TableSection>
	);
};

export default HiredCandidatesRoute;
