/** @format */

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { DataTable } from "@/components/common/data-table/data-table";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { matchQueryStatus } from "@/lib/helper-functions/async-status-render-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { href } from "react-router";
import { jobsQueries } from "../../../jobs/query-factory";
import { FooterButton } from "../../components/footer-button";
import { columns } from "./columns";

interface DataTableProps {
	className?: string;
}

export function JobsTrackingTable({ className }: DataTableProps) {
	const query = useQuery(jobsQueries?.tracking({ limit: 5 }));

	const table = useReactTable({
		data: query.data?.data ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div
			className={cn(
				"elevated-on-hover flex flex-col gap-2 rounded-md border",
				className
			)}>
			{matchQueryStatus(query, {
				Loading: (
					<p className="flex items-center self-center justify-center flex-1">
						Loading jobs applied to <LoadingIndicator />
					</p>
				),
				Errored: (e) => (
					<p className="text-red-500">
						Error occurred: {getApiErrorMessage(e)}
					</p>
				),
				Success: () => {
					return <DataTable table={table} />;
				},
			})}

			<FooterButton to={href("/jobs/tracking")} className="self-end">
				View full list
			</FooterButton>
		</div>
	);
}
