/** @format */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { UserType } from "@/lib/schemas/user";
import { SafeExtract } from "@/types";
import { AvatarImage } from "@radix-ui/react-avatar";
import { ColumnDef, Row } from "@tanstack/react-table";
import dayjs from "dayjs";
import { User } from "lucide-react";

export interface HiredCandidate {
	id: string;
	name: string;
	avatar: string;
	createdAt: string;
	userType: SafeExtract<UserType, "player" | "supporter">;
}

interface ColumnDefProps {
	onViewProfile: (row: Row<HiredCandidate>) => void;
}

export const columns = ({
	onViewProfile,
}: ColumnDefProps): ColumnDef<HiredCandidate>[] => {
	return [
		{
			header: "Name",
			accessorKey: "name",
			cell: ({ cell }) => (
				<div className="w-max">{cell.getValue() as string}</div>
			),
		},
		{
			header: "Avatar",
			accessorKey: "avatar",
			cell: ({ row }) => {
				const avatar = getFileNameUrl(row.original.avatar);
				return (
					<Avatar>
						<AvatarImage src={avatar} />
						<AvatarFallback>
							<User />
						</AvatarFallback>
					</Avatar>
				);
			},
		},
		{
			header: () => <div className="w-max">Date (hired)</div>,
			accessorKey: "createdAt",
			cell: ({ row }) => {
				const date = row.original.createdAt;

				return <div>{dayjs(date).format("DD-MM-YYYY")}</div>;
			},
		},
		{
			id: "viewProfile",
			cell: ({ row }) => (
				<Button
					className="bg-green-100 text-green-500"
					onClick={() => onViewProfile(row)}>
					View Profile
				</Button>
			),
		},
	];
};
