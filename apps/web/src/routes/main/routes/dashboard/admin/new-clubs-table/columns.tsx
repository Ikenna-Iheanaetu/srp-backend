/** @format */

import { TableDateCell } from "@/components/common/data-table/date-cell";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { ColumnDef } from "@tanstack/react-table";
import { ClubProfileData } from "../../../profile/club/use-fetch-profile";

interface NewClub extends Pick<ClubProfileData, "category"> {
	id: string;
	name: string;
	createdAt: string;
}

const columns: ColumnDef<NewClub>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => <TruncatedTextCell value={row.original.name} />,
	},
	{
		accessorKey: "category",
		header: "Category",
		cell: ({ row }) =>
			row.original.category ? (
				<TruncatedTextCell value={row.original.category} />
			) : (
				"--"
			),
	},
	{
		accessorKey: "createdAt",
		header: "Date",
		cell: ({ row }) => <TableDateCell date={row.original.createdAt} />,
	},
];

export { columns };
export type { NewClub };
