/** @format */

import { AvatarWithText } from "@/components/common/avatar-with-text";
import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { TableActionButton } from "@/components/common/data-table/action-button";
import { TableDateCell } from "@/components/common/data-table/date-cell";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { LinkButton } from "@/components/common/link-btn";
import { UserTypeBadge } from "@/components/common/user-type-badge";
import { createColumnConfigHelper } from "@/components/data-table-filter/core/filters";
import { Badge } from "@/components/ui/badge";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { calculateNewMeta } from "@/lib/helper-functions/pagination";
import { getErrorMessage } from "@/lib/utils";
import { ClubReferredUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { BazzaQueryFilters, FilterColumnConfig } from "@/types/tanstack-table";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarArrowUpIcon } from "lucide-react";
import React from "react";
import { href } from "react-router";
import { toast } from "sonner";
import {
	EntityProfileLocationState,
	EntityProfileParams,
} from "../../../entity/schemas";
import { ClubProfileData } from "../../../profile/club/use-fetch-profile";
import { useInvitesApprovalTableConfig } from "./data-table";

type InvitedUser = {
	id: string;
	type: ClubReferredUserType;
	name: string;
	club: Pick<ClubProfileData, "name" | "id" | "avatar">;
	invitedAt: string;
} & (
	| { hasSignedUp: true; profileId: string }
	| { hasSignedUp: false; profileId: null }
);

type UserInviteActionType = "approve" | "decline";
interface ServerInviteStatusParams {
	status: "approved" | "declined";
}

const useUserInviteAction = (actionType: UserInviteActionType) => {
	const { queryOptions } = useInvitesApprovalTableConfig();

	const mutationFn = async (user: InvitedUser) => {
		await apiAxiosInstance.patch(`/admin/affiliates/invites/${user.id}`, {
			status: `${actionType}d`,
		} satisfies ServerInviteStatusParams);
	};

	const getSuccessMessage = (userName: string) =>
		actionType === "approve"
			? `User ${userName} approved successfully.`
			: `User ${userName} declined successfully.`;

	const getErrorTitle = (userName: string) =>
		actionType === "approve"
			? `Failed to approve user: ${userName}`
			: `Failed to decline user: ${userName}`;

	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: mutationFn,
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
			toast.success(getSuccessMessage(user.name), {});
		},
		onError: (error, user) => {
			toast.error(getErrorTitle(user.name), {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface InviteActionButtonProps {
	user: InvitedUser;
	actionType: UserInviteActionType;
}

const InviteActionButton_: React.FC<InviteActionButtonProps> = ({
	user,
	actionType,
}) => {
	const { mutate, isPending } = useUserInviteAction(actionType);
	const [isConfirmingDecline, setIsConfirmingDecline] = React.useState(false);

	const handleAction = () => {
		if (actionType === "decline") {
			setIsConfirmingDecline(true);
		} else {
			mutate(user);
		}
	};

	return (
		<>
			<TableActionButton
				className={
					actionType === "approve"
						? "table-action-green"
						: "table-action-red"
				}
				onClick={handleAction}
				disabled={isPending || !user.hasSignedUp}>
				{actionType === "approve" ? "Approve" : "Decline"}
			</TableActionButton>

			{actionType === "decline" && (
				<CriticalActionConfirmationDialog
					open={isConfirmingDecline}
					onOpenChange={setIsConfirmingDecline}
					title="Decline Invitation"
					description={`Are you sure you want to decline the invitation for "${user.name}"? This action cannot be undone.`}
					confirmText="decline"
					confirmButtonText="Decline"
					onConfirm={() => mutate(user)}
				/>
			)}
		</>
	);
};

// Introduced to fix the problem of two buttons sharing the same mutation state
// because of how React incorrectly maps key prop to them.
const InviteActionButton: typeof InviteActionButton_ = ({
	user,
	actionType,
}) => <InviteActionButton_ key={user.id} user={user} actionType={actionType} />;

const columns: ColumnDef<InvitedUser>[] = [
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

			return <AvatarWithText src={club.avatar} text={club.name} />;
		},
	},
	{
		accessorKey: "invitedAt",
		header: "Date invited",
		cell: ({ row }) => <TableDateCell date={row.original.invitedAt} />,
	},
	{
		id: "viewProfile",
		cell: ({ row }) => {
			if (row.original.hasSignedUp) {
				const path = href("/:userType/:id", {
					userType: row.original.type,
					id: row.original.profileId,
				} satisfies EntityProfileParams);
				return (
					<LinkButton
						to={path}
						state={
							{
								crumbs: [
									{
										path: href(
											"/invite-management/invites-to-approve",
										),
										label: "Invites To Approve",
									},
									{
										path,
										label: row.original.name,
									},
								],
								isAdminViewUnApprovedUser: true,
							} satisfies CrumbsLocationState &
								EntityProfileLocationState
						}
						disableDefaultStyles
						className="table-action-green">
						View profile
					</LinkButton>
				);
			}
			return (
				<Badge variant={"secondary"} className="text-nowrap">
					Pending sign up
				</Badge>
			);
		},
	},
	{
		id: "approve",
		cell: ({ row }) => (
			<InviteActionButton user={row.original} actionType="approve" />
		),
	},
	{
		id: "decline",
		cell: ({ row }) => (
			<InviteActionButton user={row.original} actionType="decline" />
		),
	},
];

const dtf = createColumnConfigHelper<InvitedUser>();

const filters = [
	dtf
		.date()
		.id("invitedAt")
		.accessor((row) => row.invitedAt)
		.displayName("Date invited")
		.icon(CalendarArrowUpIcon)
		.build(),
] as const satisfies FilterColumnConfig<InvitedUser>[];

type InvitedUserFilters = BazzaQueryFilters<typeof filters>;

export { columns, filters };
export type { InvitedUser, InvitedUserFilters };
