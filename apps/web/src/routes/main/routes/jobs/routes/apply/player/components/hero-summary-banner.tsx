/** @format */

import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { EntityProfileParams } from "@/routes/main/routes/entity/schemas";
import { JobHeroBanner } from "@/routes/main/routes/job-management/routes/new-job/components/job-hero-banner";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { href, useLocation, useNavigate, useParams } from "react-router";
import { jobsQueries } from "../../../../query-factory";

export const HeroSummaryBanner: FC = () => {
	const { id } = useParams();
	const { data: job } = useQuery({
		...jobsQueries.detail(id!),
		enabled: !!id,
	});
	const location = useLocation();
	const navigate = useNavigate();

	return (
		job && (
			<JobHeroBanner
				employmentType={job.type}
				jobLocation={job.location}
				company={job.company}
				startDate={job.startDate}
				jobTitle={job.title}
				onViewCompany={() =>
					void navigate(
						href("/:userType/:id", {
							userType: "company",
							id: job.company.id,
						} satisfies EntityProfileParams),
						{
							state: {
								crumbs: [
									{
										to: location,
										label: `Apply to ${job.title}`,
									},
									{
										label: `Company, ${job.company.name}`,
									},
								],
							} satisfies CrumbsLocationState,
						},
					)
				}
			/>
		)
	);
};
