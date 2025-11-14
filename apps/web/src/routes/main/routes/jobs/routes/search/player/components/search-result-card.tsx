/** @format */

import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import React from "react";
import { href, useLocation, useNavigate } from "react-router";
import { JobCard } from "../../../../components/job-card";
import { BaseJob } from "../../../../types";
import { useToggleJobBookmark } from "../hook/use-toggle-job-bookmark";

export const SearchResultCard: React.FC<{ job: BaseJob }> = ({ job }) => {
	const { mutate: toggleBookmark } = useToggleJobBookmark();
	const navigate = useNavigate();
	const location = useLocation();
	return (
		<JobCard
			jobTitle={job.title}
			jobLocation={job.location}
			companyLogo={getFileNameUrl(job.company.avatar)}
			isJobBookmarked={job.isBookmarked}
			onToggleJobBookmark={() => toggleBookmark(job)}
			onApplyToJob={() => {
				void navigate(
					href(
						"/jobs/:id", // view job details first before applying
						{
							id: job.id,
						},
					),
					{
						state: {
							crumbs: [
								{
									to: location,
									label: `Jobs search`,
								},
								{
									label: `Job, ${job.title}`,
								},
							],
						} satisfies CrumbsLocationState,
					},
				);
			}}
		/>
	);
};
