/** @format */

import { TableDateCell } from "@/components/common/data-table/date-cell";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import {
	getPathDominantItem,
	TreePath,
} from "@/lib/helper-functions/generic-string-helpers";
import { ColumnDef } from "@tanstack/react-table";

export interface NewCompany {
	id: string;
	name: string;
	industry?: TreePath;
	createdAt: string;
}

export const columns: ColumnDef<NewCompany>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => <TruncatedTextCell value={row.original.name} />,
	},
	{
		accessorKey: "industry",
		header: "Industry",
		cell: ({ row }) => (
			<TruncatedTextCell
				value={
					row.original.industry
						? getPathDominantItem(row.original.industry)
						: "--"
				}
			/>
		),
	},
	{
		accessorKey: "createdAt",
		header: "Date",
		cell: ({ row }) => <TableDateCell date={row.original.createdAt} />,
	},
];
