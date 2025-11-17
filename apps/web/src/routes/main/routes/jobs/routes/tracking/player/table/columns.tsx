/** @format */

import { StatusCell } from "@/components/common/data-table/application-status-cell";
import { TableDateCell } from "@/components/common/data-table/date-cell";
import { dateRangeFilterFn } from "@/components/common/data-table/tool-bar";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { JobActiveStatus, JobApplicationStatus } from "../../../../constants";
import { BaseJob } from "../../../../types";

export interface TrackingJob extends BaseJob {
	status: JobActiveStatus;
	applicationStatus: JobApplicationStatus;
	description: string;
}

const cellbaseStyles = "w-max max-w-28 mx-8";

export const columnDefs: ColumnDef<TrackingJob>[] = [
	{
		header: () => <div className={cn(cellbaseStyles, "ml-0")}>Company</div>,
		accessorKey: "company",
		cell: ({ row }) => {
			if (!row.original.company) {
				console.error("row.original.company is nullish", row.original);
				return;
			}

			return (
				<div className={cn(cellbaseStyles, "ml-0")}>
					{row.original.company.name}
				</div>
			);
		},
	},
	{
		header: () => (
			<div className={cn(cellbaseStyles, "ml-0")}>Job Status</div>
		),
		accessorKey: "status",
		cell: ({ row }) => <StatusCell status={row.original.status} />,
	},
	{
		header: () => <div className={cellbaseStyles}>Position</div>,
		accessorKey: "title",
		cell: ({ row }) => (
			<div className={cn(cellbaseStyles)}>{row.original.title}</div>
		),
	},
	{
		header: () => <div className={cellbaseStyles}>Date Posted</div>,
		accessorKey: "createdAt",
		cell: ({ row }) => <TableDateCell date={row.original.createdAt} />,
		meta: { isGlobalDateFilter: true },
		filterFn: dateRangeFilterFn,
	},
	{
		header: () => <div className={cellbaseStyles}>Application Status</div>,
		accessorKey: "applicationStatus",
		cell: ({ row }) => (
			<StatusCell status={row.original.applicationStatus} />
		),
	},
	// We don't support match percent feature for now
	// {
	// 	header: () => <div className={cellbaseStyles}>% Match</div>,
	// 	accessorKey: "match",
	// 	cell: () => {
	// 		return (
	// 			<div className={cellbaseStyles}>
	// 				<AnimatedColorProgress
	// 					className="opacity-50 cursor-not-allowed"
	// 					aria-disabled
	// 					value={0}
	// 				/>
	// 			</div>
	// 		);
	// 	},
	// 	filterFn: matchPercentFilterFn,
	// },
];
