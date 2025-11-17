/** @format */

import { AvatarWithText } from "@/components/common/avatar-with-text";
import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { TableActionButton } from "@/components/common/data-table/action-button";
import { TableDateCell } from "@/components/common/data-table/date-cell";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { UserTypeBadge } from "@/components/common/user-type-badge";
import { createColumnConfigHelper } from "@/components/data-table-filter/core/filters";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { calculateNewMeta } from "@/lib/helper-functions/pagination";
import { getErrorMessage } from "@/lib/utils";
import { AllowedSignupUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { BazzaQueryFilters, FilterColumnConfig } from "@/types/tanstack-table";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarArrowUpIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { ClubProfileData } from "../../../profile/club/use-fetch-profile";
import { useUnclaimedInvitesTableConfig } from "./data-table";

interface BaseInviteUser {
	id: string;
	type: SafeExtract<AllowedSignupUserType, "club" | "company">;
	email: string;
	invitedAt: string;
}

interface CompanyInviteUser extends BaseInviteUser {
	type: "company";
	club: Pick<ClubProfileData, "name" | "id" | "avatar">;
}

interface ClubInviteUser extends BaseInviteUser {
	type: "club";
	club?: never;
}

type UnclaimedInviteUser = ClubInviteUser | CompanyInviteUser;

interface ServerRevokeInviteParams {
	status: "declined";
}

const useRevokeInvite = () => {
	const { queryOptions } = useUnclaimedInvitesTableConfig();

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (user: UnclaimedInviteUser) => {
			await apiAxiosInstance.put(`/admin/affiliates/invites/${user.id}`, {
				status: "declined",
			} satisfies ServerRevokeInviteParams);
		},
		updater: (old, user) => {
			if (!old) return old;

			const filteredUsers = old.data.filter((a) => a.id !== user.id);

			const actualItemsRemoved = old.data.length - filteredUsers.length;

			const newDataTotal = old.meta.total - actualItemsRemoved;

			const newMeta = calculateNewMeta({
				newDataTotal,
				prevMeta: old.meta,
			});

			const filtered = {
				...old,
				data: filteredUsers,
				meta: newMeta,
			};
			return filtered;
		},
		onSuccess: (_, user) => {
			toast.success(
				`User ${user.email} invite revoked successfully.`,
				{},
			);
		},
		onError: (error, user) => {
			toast.error(`Failed to revoke invite for user: ${user.email}`, {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface RevokeInviteActionButtonProps {
	user: UnclaimedInviteUser;
}

const RevokeInviteActionButton: React.FC<RevokeInviteActionButtonProps> = ({
	user,
}) => {
	const { mutate, isPending } = useRevokeInvite();
	const [isConfirmingRevoke, setIsConfirmingRevoke] = React.useState(false);

	return (
		<>
			<TableActionButton
				className={"table-action-red"}
				onClick={() => setIsConfirmingRevoke(true)}
				disabled={isPending}>
				Revoke
			</TableActionButton>

			<CriticalActionConfirmationDialog
				open={isConfirmingRevoke}
				onOpenChange={setIsConfirmingRevoke}
				title="Revoke Invitation"
				description={`Are you sure you want to revoke the invitation for "${user.email}"? This will prevent them from signing up with the original link.`}
				confirmText="revoke"
				confirmButtonText="Revoke"
				onConfirm={() => mutate(user)}
			/>
		</>
	);
};

const useResendInvite = () => {
	return useMutation({
		mutationFn: async (user: UnclaimedInviteUser) => {
			await apiAxiosInstance.post(
				`/admin/affiliates/invites/resend/${user.id}`,
			);
		},
		onSuccess: (_, user) => {
			toast.success(`Successfully resent invite to ${user.email}.`);
		},
		onError: (error, user) => {
			toast.error(`Failed to resend invite to ${user.email}`, {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface ResendInviteActionButtonProps {
	user: UnclaimedInviteUser;
}

const ResendInviteActionButton: React.FC<ResendInviteActionButtonProps> = ({
	user,
}) => {
	const { mutate, isPending } = useResendInvite();

	return (
		<TableActionButton
			className={"table-action-green"}
			title="Resend invite"
			onClick={() => mutate(user)}
			disabled={isPending}>
			{isPending ? (
				<>
					Resending <LoadingIndicator />
				</>
			) : (
				"Resend"
			)}
		</TableActionButton>
	);
};

const columns: ColumnDef<UnclaimedInviteUser>[] = [
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => <TruncatedTextCell value={row.original.email} />,
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
			return club ? (
				<AvatarWithText src={club.avatar} text={club.name} />
			) : (
				"--"
			);
		},
	},
	{
		accessorKey: "invitedAt",
		header: "Date invited",
		cell: ({ row }) => <TableDateCell date={row.original.invitedAt} />,
	},
	{
		id: "resend",
		cell: ({ row }) => (
			<ResendInviteActionButton
				key={row.original.id}
				user={row.original}
			/>
		),
	},
	{
		id: "revoke",
		cell: ({ row }) => (
			<RevokeInviteActionButton
				key={row.original.id}
				user={row.original}
			/>
		),
	},
];

const dtf = createColumnConfigHelper<UnclaimedInviteUser>();

const filters = [
	dtf
		.date()
		.id("invitedAt")
		.accessor((row) => row.invitedAt)
		.displayName("Date invited")
		.icon(CalendarArrowUpIcon)
		.build(),
] as const satisfies FilterColumnConfig<UnclaimedInviteUser>[];

type UnclaimedInvitesFilters = BazzaQueryFilters<typeof filters>;

export { columns, filters };
export type { UnclaimedInvitesFilters, UnclaimedInviteUser };
