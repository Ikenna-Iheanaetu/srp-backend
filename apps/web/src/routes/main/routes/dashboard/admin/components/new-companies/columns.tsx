/** @format */

import { TableDateCell } from "@/components/common/data-table/date-cell";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { NewCompanyItem } from "../../query-factory";
import { capitalize } from "@/lib/helper-functions";
import { getPathDominantItem } from "@/lib/helper-functions/generic-string-helpers";
import { href, Link } from "react-router";

export const newCompaniesColumns: ColumnDef<NewCompanyItem>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => (
			<Link
				to={href("/:userType/:id", { userType: "company", id: row.original.id })}
				className="text-[#00647E] font-normal hover:underline text-left">
				{row.original.name}
			</Link>
		),
	},
	{
		accessorKey: "industry",
		header: "Industry",
		cell: ({ row }) => (
			<span className="text-gray-900">{getPathDominantItem(row.original.industry)}</span>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.original.status;
			return (
				<Badge
					variant={status === "approved" ? "default" : "secondary"}
					className={
						status === "approved"
							? "bg-green-50 rounded-full text-green-700 font-medium hover:bg-green-200 border border-green-200"
							: "bg-gray-100 rounded-full text-gray-700 font-medium hover:bg-gray-200 border border-gray-200"
					}>
					{capitalize(status)}
				</Badge>
			);
		},
	},
	{
		accessorKey: "dateTime",
		header: "Date/Time",
		cell: ({ row }) => (
				<TableDateCell date={row.original.dateTime} />
		),
	},
];
