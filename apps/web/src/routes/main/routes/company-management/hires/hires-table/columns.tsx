/** @format */

import { AvatarWithText } from "@/components/common/avatar-with-text";
import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { TableActionButton } from "@/components/common/data-table/action-button";
import { StatusCell } from "@/components/common/data-table/application-status-cell";
import { ColumnHeader } from "@/components/common/data-table/column-header";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { ColumnDef } from "@tanstack/react-table";
import React, { FC } from "react";
import { EntityRequestParams } from "../../../entity/query-factory";
import { JobApplicationStatus } from "../../../jobs/constants";
import { ClubProfileData } from "../../../profile/club/use-fetch-profile";
import { PlayerOrSupporterUser } from "../../../profile/player/use-player-profile-data";
import { useDeleteCompanyHire } from "./use-delete-hire";

export interface CompanyHire {
	id: string;
	name: string;
	affiliateType: PlayerOrSupporterUser;
	club: Pick<ClubProfileData, "name" | "id" | "avatar">;
	status: JobApplicationStatus;
}

interface DeleteHireButtonProps {
	hire: CompanyHire;
}

const DeleteHireButton: FC<DeleteHireButtonProps> = ({ hire }) => {
	const { mutate: deleteHire, isPending } = useDeleteCompanyHire();
	const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

	return (
		<>
			<TableActionButton
				onClick={() => setIsConfirmingDelete(true)}
				className="table-action-red"
				disabled={isPending}>
				Delete
			</TableActionButton>

			<CriticalActionConfirmationDialog
				open={isConfirmingDelete}
				onOpenChange={setIsConfirmingDelete}
				title="Delete Hire"
				description={`Are you sure you want to delete the hire for "${hire.name}"? This action cannot be undone.`}
				confirmText="delete"
				confirmButtonText="Delete"
				onConfirm={() => deleteHire(hire)}
			/>
		</>
	);
};

interface ColumnProps {
	onViewProfile: (params: EntityRequestParams) => void;
}

export const columns = ({
	onViewProfile,
}: ColumnProps): ColumnDef<CompanyHire>[] => {
	return [
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => <TruncatedTextCell value={row.original.name} />,
		},
		{
			accessorKey: "affiliateType",
			header: () => <ColumnHeader>Affiliate Type</ColumnHeader>,
			cell: ({ row }) => (
				<TruncatedTextCell value={row.original.affiliateType} />
			),
		},
		{
			accessorKey: "club",
			header: "Club",
			cell: ({ row }) => (
				<AvatarWithText
					src={getFileNameUrl(row.original.club.avatar)}
					text={row.original.club.name}
				/>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.original.status;
				return <StatusCell status={status} />;
			},
		},
		{
			id: "viewProfile",
			cell: ({ row }) => {
				const params = {
					userType: row.original.affiliateType,
					id: row.original.id,
				} satisfies EntityRequestParams;

				return (
					<TableActionButton
						onClick={() => onViewProfile(params)}
						className="table-action-green">
						View Profile
					</TableActionButton>
				);
			},
		},
		{
			id: "delete",
			cell: ({ row }) => {
				return <DeleteHireButton hire={row.original} />;
			},
		},
	];
};
