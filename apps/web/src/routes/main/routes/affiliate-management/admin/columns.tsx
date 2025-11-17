/** @format */

import { AvatarWithText } from "@/components/common/avatar-with-text";
import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { TableActionButton } from "@/components/common/data-table/action-button";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { LinkButton } from "@/components/common/link-btn";
import { UserTypeBadge } from "@/components/common/user-type-badge";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { UserType } from "@/lib/schemas/user";
import { getErrorMessage } from "@/lib/utils";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { href } from "react-router";
import { toast } from "sonner";
import { ClubProfileData } from "../../profile/club/use-fetch-profile";
import { useAffiliatesTableConfig } from "./data-table";
import { calculateNewMeta } from "@/lib/helper-functions/pagination";

interface Affiliate {
	/** The user profile "id" for any profile related actions*/
	id: string;
	/** The user's affiliate "id" for any affiliate related actiions */
	affiliateId: string;
	type: SafeExtract<UserType, "player" | "supporter">;
	name: string;
	club: Pick<ClubProfileData, "id" | "name" | "avatar">;
}

const useDeleteAffiliate = () => {
	const { queryOptions } = useAffiliatesTableConfig();
	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (affiliate: Affiliate) => {
			await apiAxiosInstance.delete(
				`/admin/affiliates/${affiliate.affiliateId}`,
			);
		},
		updater: (old, affiliate) => {
			if (!old) return old;

			const filteredAffiliates = old.data.filter(
				(a) => a.affiliateId !== affiliate.affiliateId,
			);

			const actualItemsRemoved =
				old.data.length - filteredAffiliates.length;

			const newDataTotal = old.meta.total - actualItemsRemoved;

			const newMeta = calculateNewMeta(newDataTotal, old.meta);

			const filtered = {
				...old,
				data: filteredAffiliates,
				meta: newMeta,
			};
			return filtered;
		},
		onSuccess: (_, affiliate) => {
			toast.success(
				`Affiliate ${affiliate.name} deleted successfully.`,
				{},
			);
		},
		onError: (error, affiliate) => {
			toast.error(`Failed to delete affiliate: ${affiliate.name}`, {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface DeleteAffiliateButtonProps {
	affiliate: Affiliate;
}

const DeleteAffiliateButton = ({ affiliate }: DeleteAffiliateButtonProps) => {
	const { mutate, isPending } = useDeleteAffiliate();
	const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

	return (
		<>
			<TableActionButton
				className="table-action-red"
				onClick={() => setIsConfirmingDelete(true)}
				disabled={isPending}>
				Delete
			</TableActionButton>

			<CriticalActionConfirmationDialog
				open={isConfirmingDelete}
				onOpenChange={setIsConfirmingDelete}
				title="Delete Affiliate"
				description={`Are you sure you want to delete ${affiliate.name}? This action cannot be undone.`}
				confirmText="delete"
				confirmButtonText="Delete"
				onConfirm={() => mutate(affiliate)}
			/>
		</>
	);
};

const columns: ColumnDef<Affiliate>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => <TruncatedTextCell value={row.original.name} />,
	},
	{
		accessorKey: "type",
		header: "Affiliate Type",
		cell: ({ row }) => <UserTypeBadge userType={row.original.type} />,
	},
	{
		accessorKey: "club",
		header: "Club",
		cell: ({ row }) => {
			const club = row.original.club;
			if (!club) {
				return;
			}
			return <AvatarWithText src={club.avatar} text={club.name} />;
		},
	},
	{
		id: "viewProfile",
		cell: ({ row }) => {
			const affiliate = row.original;
			const path = href("/:userType/:id", {
				userType: affiliate.type,
				id: affiliate.id,
			});
			return (
				<LinkButton
					to={path}
					state={
						{
							crumbs: [
								{
									path: href("/affiliate-management"),
									label: "Affiliate Management",
								},
								{
									path,
									label: affiliate.name,
								},
							],
						} satisfies CrumbsLocationState
					}
					disableDefaultStyles
					className="table-action-green">
					View Profile
				</LinkButton>
			);
		},
	},
	{
		id: "delete",
		cell: ({ row }) => (
			<DeleteAffiliateButton
				key={row.original.id}
				affiliate={row.original}
			/>
		),
	},
];

export { columns };
export type { Affiliate };
