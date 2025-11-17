/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { TableActionButton } from "@/components/common/data-table/action-button";
import { TruncatedNumberCell } from "@/components/common/data-table/truncated-number-cell";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { LinkButton } from "@/components/common/link-btn";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import { ColumnDef } from "@tanstack/react-table";
import React, { FC } from "react";
import { href } from "react-router";
import { useDeleteClub } from "./use-delete-club";

interface Club extends Pick<ClubProfileData, "name" | "refCode"> {
	id: string;
	count: number;
}

interface DeleteClubButtonProps {
	club: Club;
}

const DeleteClubButton: FC<DeleteClubButtonProps> = ({ club }) => {
	const { mutate: deleteClub, isPending } = useDeleteClub();
	const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

	return (
		<>
			<TableActionButton
				onClick={() => setIsConfirmingDelete(true)}
				className="table-action-red hover:bg-red-200"
				disabled={isPending}>
				Delete
			</TableActionButton>

			<CriticalActionConfirmationDialog
				open={isConfirmingDelete}
				onOpenChange={setIsConfirmingDelete}
				title="Delete Club"
				description={`Are you sure you want to delete the club "${club.name}"? This will permanently delete all associated data and cannot be undone.`}
				confirmText="delete"
				confirmButtonText="Delete"
				onConfirm={() => deleteClub(club)}
			/>
		</>
	);
};

const columns: ColumnDef<Club>[] = [
	{
		accessorKey: "name",
		header: "Club Name",
		cell: ({ row }) => <TruncatedTextCell value={row.original.name} />,
	},
	{
		accessorKey: "count",
		header: "Affiliates",
		cell: ({ row }) => <TruncatedNumberCell value={row.original.count} />,
	},
	{
		id: "viewHires",
		cell: ({ row }) => {
			const path = href("/club-management/:id", {
				id: row.original.id,
			});
			return (
				<LinkButton
					disableDefaultStyles
					to={path}
					state={
						{
							crumbs: [
								{
									path: href("/club-management"),
									label: "Club management",
								},
								{ path, label: `${row.original.name}, hired` },
							],
						} satisfies CrumbsLocationState
					}
					className="table-action-green">
					View Hired
				</LinkButton>
			);
		},
	},
	{
		id: "delete",
		cell: ({ row }) => {
			return (
				<DeleteClubButton key={row.original.id} club={row.original} />
			);
		},
	},
];

export { columns };
export type { Club };
