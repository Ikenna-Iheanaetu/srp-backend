/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { FC } from "react";
import { href } from "react-router";
import AiMatchedApplicants from "./ai-matched-applicants";
import HeroBanner from "./hero-banner";
import { MetricsDataMapper } from "./metrics-data";
import NewApplicantsTable from "./new-applicants-table";
import { useFetchDashboardData } from "./use-fetch-dashboard-data";

const CompanyDashboard: FC = () => {
	const { data } = useFetchDashboardData();

	return (
		data && (
			<div className="flex flex-col gap-8 sm:gap-12">
				{/* date and action buttons row */}
				<section className="flex flex-wrap justify-between gap-4 rounded-bl-sm rounded-br-sm bg-white p-2 lg:justify-end">
					<LinkButton
						variant={"outline"}
						to={href("/recruiting/search")}>
						Candidates search
					</LinkButton>

					<LinkButton to={href("/job-management/new")}>
						Post a job
					</LinkButton>
				</section>

				{/* hero section */}
				<header className="flex flex-col gap-4">
					<HeroBanner
						pendingTasks={data?.pendingTasks}
						recruitmentGoals={data.recruitmentGoals}
					/>
				</header>

				<div className="grid grid-cols-1 gap-8 sm:gap-12 xl:grid-cols-2">
					{/* Metrics cards section */}
					<section className="grid grid-cols-1 gap-8 xl:col-span-full xl:grid-cols-2">
						<MetricsDataMapper metricsData={data.metrics} />
						<AiMatchedApplicants
							className="flex-grow-0"
							applicants={data.matches}
						/>
					</section>

					{/* recruiting progress table */}
					<section className="xl:col-span-2">
						<NewApplicantsTable applicants={data.applicants} />
					</section>
				</div>
			</div>
		)
	);
};

export default CompanyDashboard;
