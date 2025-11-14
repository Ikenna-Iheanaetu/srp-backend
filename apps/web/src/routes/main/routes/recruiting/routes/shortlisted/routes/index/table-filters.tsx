/** @format */

import { StatusCell } from "@/components/common/data-table/application-status-cell";
import { createColumnConfigHelper } from "@/components/data-table-filter/core/filters";
import { JOB_ACTIVE_STATUSES } from "@/routes/main/routes/jobs/constants";
import { BazzaQueryFilters } from "@/types/tanstack-table";
import { Briefcase } from "lucide-react";
import { ShortlistedJob } from "./columns";

const filtersHelper = createColumnConfigHelper<ShortlistedJob>();

export const shortlistedJobsFiltersConfig = [
	filtersHelper
		.option()
		.id("status")
		.accessor((job) => job.status)
		.displayName("Status")
		.icon(Briefcase)
		.options(
			JOB_ACTIVE_STATUSES.map((value) => ({
				value,
				label: "",
				icon: <StatusCell status={value} />,
			}))
		)
		.build(),
] as const;

export type ShortlistedJobFilters = BazzaQueryFilters<
	typeof shortlistedJobsFiltersConfig
>;
