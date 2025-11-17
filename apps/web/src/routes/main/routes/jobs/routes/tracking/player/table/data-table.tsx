/** @format */

import {
	DataTableAdvanced,
	DataTableRow,
} from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { useState } from "react";
import { JobDetailsModal } from "../../../../components/job-details-modal";
import { jobsQueries } from "../../../../query-factory";
import { columnDefs, TrackingJob } from "./columns";
import { filterDefs } from "./table-filters";

export const DataTable = () => {
	const { dataTableAdvancedProps } = useServerTableQuery({
		getQueryOptions: jobsQueries.tracking,
		tableColumnsDef: columnDefs,
		filterColumnsConfig: filterDefs,
	});

	const [focusedJob, setFocusedJob] = useState<TrackingJob | null>(null);

	return (
		<>
			<DataTableAdvanced
				{...dataTableAdvancedProps}
				renderRow={(row) => (
					<DataTableRow
						row={row}
						onDoubleClick={() => setFocusedJob(row.original)}
					/>
				)}
			/>

			{focusedJob && (
				<JobDetailsModal
					jobId={focusedJob.id}
					jobTitle={focusedJob.title}
					jobDescription={focusedJob.description}
					jobLocation={focusedJob.location}
					jobActiveStatus={focusedJob.status}
					jobApplicationStatus={focusedJob.applicationStatus}
					jobMatchPercent={focusedJob.match}
					jobPostedDate={focusedJob.createdAt}
					jobAppliedDate={focusedJob.appliedDate}
					companyName={focusedJob.company.name}
					onClose={() => setFocusedJob(null)}
				/>
			)}
		</>
	);
};
