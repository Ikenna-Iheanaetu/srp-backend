/** @format */

import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { ColumnDef } from "@tanstack/react-table";
import { ImageOff } from "lucide-react";
import {
	DeleteCompanyButton,
	ViewHiredButton,
	ViewProfileButton,
} from "./components";
import { Company } from "./types";

export const columns: ColumnDef<Company>[] = [
	{
		accessorKey: "name",
		header: "Company Name",
		cell: ({ row }) => <ViewProfileButton company={row.original} />,
	},
	{
		accessorKey: "club",
		header: "Club",
		cell: ({ row }) => {
			const club = row.original.club;

			return (
				<div className="flex items-center gap-2">
					<Avatar>
						<AvatarImage src={getFileNameUrl(club.avatar)} />
						<AvatarFallback>
							<ImageOff />
						</AvatarFallback>
					</Avatar>

					<TruncatedTextCell value={club.name} />
				</div>
			);
		},
	},
	{
		id: "viewHires",
		cell: ({ row }) => <ViewHiredButton company={row.original} />,
	},
	{
		id: "delete",
		cell: ({ row }) => {
			return (
				<DeleteCompanyButton
					key={row.original.id}
					company={row.original}
				/>
			);
		},
	},
];
