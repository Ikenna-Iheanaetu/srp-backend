/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { FileItem } from "@/components/common/file-item-mapper";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { UserType } from "@/lib/schemas/user";
import { SafeExtract } from "@/types";
import { AvatarImage } from "@radix-ui/react-avatar";
import { ColumnDef, Row } from "@tanstack/react-table";
import dayjs from "dayjs";
import { User } from "lucide-react";
import React, { FC } from "react";
import { useHireCandidate } from "./use-hire-candidate";
import { useRemoveCandidate } from "./use-remove-candidate";

export interface ShortlistedCandidate {
	id: string;
	name: string;
	avatar: string;
	createdAt: string;
	userType: SafeExtract<UserType, "player" | "supporter">;
	resume?: string;
}

interface HireButtonProps {
	candidate: ShortlistedCandidate;
}

const RemoveButton: FC<HireButtonProps> = ({ candidate }) => {
	const { mutate: removeCandidate, isPending } = useRemoveCandidate();
	const [isConfirmingRemove, setIsConfirmingRemove] = React.useState(false);

	return (
		<>
			<Button
				className="bg-red-100 text-red-500"
				onClick={() => setIsConfirmingRemove(true)}
				disabled={isPending}>
				Remove
			</Button>

			<CriticalActionConfirmationDialog
				open={isConfirmingRemove}
				onOpenChange={setIsConfirmingRemove}
				title="Remove Candidate"
				description={`Are you sure you want to remove the candidate "${candidate.name}"? This action cannot be undone.`}
				confirmText="remove"
				confirmButtonText="Remove"
				onConfirm={() => removeCandidate(candidate)}
			/>
		</>
	);
};

interface HireButtonProps {
	candidate: ShortlistedCandidate;
}

const HireButton: FC<HireButtonProps> = ({ candidate }) => {
	const { mutate: hireCandidate } = useHireCandidate();

	return (
		<Button
			className="bg-green-100 px-8 text-green-500"
			onClick={() => hireCandidate(candidate)}>
			Hire
		</Button>
	);
};

interface ColumnDefProps {
	onViewProfile: (row: Row<ShortlistedCandidate>) => void;
}

export const columns = ({
	onViewProfile,
}: ColumnDefProps): ColumnDef<ShortlistedCandidate>[] => {
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
			header: () => <div className="w-max">Date (shortlisted)</div>,
			accessorKey: "createdAt",
			cell: ({ row }) => {
				const date = row.original.createdAt;

				return <div>{dayjs(date).format("DD-MM-YYYY")}</div>;
			},
		},
		{
			header: "Resume",
			accessorKey: "resume",
			cell: ({ row }) => {
				const resume = row.original.resume;

				if (!resume) {
					return <span>--</span>;
				}

				return <FileItem filename={resume} />;
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

		{
			id: "hire",
			cell: ({ row }) => <HireButton candidate={row.original} />,
		},
		{
			id: "remove",
			cell: ({ row }) => <RemoveButton candidate={row.original} />,
		},
	];
};
