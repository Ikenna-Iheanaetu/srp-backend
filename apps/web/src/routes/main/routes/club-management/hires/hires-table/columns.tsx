/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { TableActionButton } from "@/components/common/data-table/action-button";
import { ColumnHeader } from "@/components/common/data-table/column-header";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { ClubReferredUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { SafeExclude } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import React, { FC } from "react";
import { EntityRequestParams } from "../../../entity/query-factory";
import { useDeleteClubHire } from "./use-delete-hire";

export interface ClubHire {
	id: string;
	name: string;
	affiliateType: SafeExclude<ClubReferredUserType, "company">;
}

interface DeleteHireButtonProps {
	hire: ClubHire;
}

const DeleteHireButton: FC<DeleteHireButtonProps> = ({ hire }) => {
	const { mutate: deleteHire, isPending } = useDeleteClubHire();
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
				description={`Are you sure you want to delete the hire for ${hire.name}? This action cannot be undone.`}
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
}: ColumnProps): ColumnDef<ClubHire>[] => {
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
