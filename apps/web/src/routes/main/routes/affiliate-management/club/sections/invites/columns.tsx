/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { TableActionButton } from "@/components/common/data-table/action-button";
import { StatusCell } from "@/components/common/data-table/application-status-cell";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { UserTypeBadge } from "@/components/common/user-type-badge";
import { createColumnConfigHelper } from "@/components/data-table-filter/core/filters";
import { Badge } from "@/components/ui/badge";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import apiAxiosInstance from "@/lib/axios-instance";
import { capitalize } from "@/lib/helper-functions";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { ClubReferredUserTypeSchema } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { ClubReferredUserProfile } from "@/routes/main/routes/profile/types";
import { BazzaQueryFilters, FilterColumnConfig } from "@/types/tanstack-table";
import { ColumnDef } from "@tanstack/react-table";
import { Info, User } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useInvitedAffiliatesTableConfig } from "./data-table";

interface BaseInvitedAffiliate {
	id: string;
	email: string;
	status: "pending" | "active";
	userData: ClubReferredUserProfile;
}

interface ActiveInvitedAffiliate extends BaseInvitedAffiliate {
	status: "active";
}

interface PendingInvitedAffiliate extends BaseInvitedAffiliate {
	status: "pending";
}

export type InvitedAffiliate = ActiveInvitedAffiliate | PendingInvitedAffiliate;

const useCancelInvite = () => {
	const { queryOptions } = useInvitedAffiliatesTableConfig();

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		updater: (old, affiliate) => {
			if (!old) return old;

			return {
				...old,
				data: old.data.filter((aff) => aff.id !== affiliate.id),
			};
		},
		mutationFn: async (affiliate: PendingInvitedAffiliate) => {
			await apiAxiosInstance.put(`/club/affiliates/${affiliate.id}`);
		},
		onSuccess: (_, affiliate) => {
			toast.success(
				`Successfully cancelled invitation of ${affiliate.email}`,
			);
		},
		onError: (error, affiliate) => {
			toast.error(`Failed to cancel invitation of ${affiliate.email}`, {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface CancelInviteButtonProps {
	affiliate: PendingInvitedAffiliate;
}
const CancelInviteButton: React.FC<CancelInviteButtonProps> = ({
	affiliate,
}) => {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);

	const { mutate, isPending } = useCancelInvite();

	return (
		<>
			<TableActionButton
				disabled={isPending}
				className="table-action-red"
				onClick={() => setIsDialogOpen((prev) => !prev)}>
				Cancel
			</TableActionButton>
			<CriticalActionConfirmationDialog
				onConfirm={() => mutate(affiliate)}
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				confirmText="cancel"
				title={`Cancel sent invite for ${affiliate.email}`}
				description="Note that this action cannot be undone and you'd need to invite the user again."
			/>
		</>
	);
};

const statusStylesMap = {
	pending: "status-yellow",
	active: "status-green",
} as const satisfies Record<InvitedAffiliate["status"], string>;

export const columns: ColumnDef<InvitedAffiliate>[] = [
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => <TruncatedTextCell value={row.original.email} />,
	},
	{
		accessorKey: "userData",
		header: "Type",
		cell: ({ row }) => {
			if (!row.original.userData) {
				console.error("userData nullish", row.original.userData);
				return null;
			}
			return <UserTypeBadge userType={row.original.userData.userType} />;
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			return (
				<StatusCell
					status={row.original.status}
					getStatusStyles={(status) => statusStylesMap[status]}
				/>
			);
		},
	},

	{
		id: "cancel",
		cell: ({ row }) => {
			const affiliate = row.original;

			if (affiliate.status === "active") {
				return <Badge variant={"secondary"}>Invite accepted</Badge>;
			}

			return <CancelInviteButton affiliate={affiliate} />;
		},
	},
];

const dtf = createColumnConfigHelper<InvitedAffiliate>();

export const filters = [
	dtf
		.option()
		.id("status")
		.accessor((row) => row.status)
		.displayName("Status")
		.options(
			(["active", "pending"] satisfies InvitedAffiliate["status"][]).map(
				(value) => ({
					value,
					label: capitalize(value),
					icon: (
						<StatusCell
							key={value}
							status={value}
							getStatusStyles={(s) => statusStylesMap[s]}
						/>
					),
				}),
			),
		)
		.icon(Info)
		.build(),
	dtf
		.option()
		.id("affiliateTypes")
		.accessor((row) => row.userData.userType)
		.displayName("Affiliate type")
		.options(
			ClubReferredUserTypeSchema.options.map((value) => ({
				value,
				label: capitalize(value),
				icon: <UserTypeBadge userType={value} />,
			})),
		)
		.icon(User)
		.build(),
] as const satisfies FilterColumnConfig<InvitedAffiliate>[];

export type InvitedAffiliateFilters = BazzaQueryFilters<typeof filters>;
