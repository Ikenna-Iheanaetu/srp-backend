/** @format */

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { postedJobsQueries } from "../../../job-management/routes/job-posted/query-factory";
import JobCard from "./job-card";

const ActiveJobsList: FC = () => {
	const { data: jobsPosted } = useQuery(postedJobsQueries.jobs());
	return (
		<div className={cn("flex flex-col gap-4")}>
			<h2 className="heading-2 capitalize">Active Jobs Listing</h2>

			<ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{jobsPosted?.data.slice(0, 5).map((jobItem, index) => {
					return (
						<li key={index}>
							<JobCard {...jobItem} />
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default ActiveJobsList;
