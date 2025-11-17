/** @format */

import { getJobActiveStatusStyles } from "@/lib/helper-functions/get-job-active-status-styles";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { BaseJob } from "../../../jobs/types";

export const columns: ColumnDef<BaseJob>[] = [
	{
		accessorKey: "company",
		header: "Company",
		cell: ({ row }) => {
			if (!row.original.company) {
				console.error("row.original.company is nullish", row.original);
				return;
			}
			return (
				<div className="w-max capitalize">
					{row.original.company.name}
				</div>
			);
		},
	},
	{
		accessorKey: "title",
		header: "Position",
		cell: ({ row }) => (
			<div className="w-max capitalize">{row.original.title}</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.original.status;

			return (
				<div className={cn(getJobActiveStatusStyles(status))}>
					{status}
				</div>
			);
		},
	},
];
