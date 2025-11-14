/** @format */
import AnimatedColorProgress from "@/components/common/animated-color-progress";
import { StatusCell } from "@/components/common/data-table/application-status-cell";
import { createColumnConfigHelper } from "@/components/data-table-filter/core/filters";
import { capitalize } from "@/lib/helper-functions";
import { replaceUnderscoresWithSpaces } from "@/lib/utils";
import { BazzaQueryFilters } from "@/types/tanstack-table";
import { BriefcaseBusiness, Percent } from "lucide-react";
import { JOB_APPLICATION_STATUSES } from "../../../../constants";
import { TrackingJob } from "./columns";

const filtersHelper = createColumnConfigHelper<TrackingJob>();

const MATCH_PERCENT_RANGES = ["0-25", "25-50", "50-75", "75-100"] as const;
export type MatchPercentRange = (typeof MATCH_PERCENT_RANGES)[number];

type MinMax<T extends string> =
	T extends `${infer Min extends number}-${infer Max extends number}`
		? [Min, Max]
		: never;

const extractRangeStops = <T extends string>(range: T): MinMax<T> => {
	const inValidMessage = "Invalid range param: " + range;
	if (typeof range !== "string") throw new Error(inValidMessage);

	const minMax = range.trim().split("-").map(Number);
	const isInvalidRange =
		minMax.length !== 2 ||
		minMax.some((point) => typeof point !== "number");

	if (isInvalidRange) throw new Error(inValidMessage);

	return minMax as MinMax<T>;
};

export const filterDefs = [
	filtersHelper
		.option()
		.id("applicationStatus")
		.accessor((job) => job.applicationStatus)
		.displayName("Application status")
		.icon(BriefcaseBusiness)
		.options(
			JOB_APPLICATION_STATUSES.map((value) => ({
				value,
				label: capitalize(replaceUnderscoresWithSpaces(value)),
				icon: <StatusCell status={value} />,
			}))
		)
		.build(),
	filtersHelper
		.option()
		.id("match")
		.accessor((job) => job.match)
		.displayName("Match percent")
		.icon(Percent)
		.options(
			MATCH_PERCENT_RANGES.map((value) => {
				const [min, max] = extractRangeStops(value);
				return {
					value,
					label: `${value}%`,
					icon: (
						<div className="grid grid-cols-2 gap-2">
							<AnimatedColorProgress
								value={min}
								showValue={false}
							/>

							<AnimatedColorProgress
								value={max}
								showValue={false}
							/>
						</div>
					),
				};
			})
		)
		.build(),
] as const;

export type TrackingJobTableFilters = BazzaQueryFilters<typeof filterDefs>;
