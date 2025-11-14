/** @format */
import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Table } from "@tanstack/react-table";
import dayjs from "dayjs";
import React from "react";
import { UserNotification } from ".";
import { useDeleteNotifications } from "../hooks/use-delete-notifications";
import { useUpdateNotificationsStatuses } from "../hooks/use-update-notifications-status";

export const ViewNotificationModal: React.FC<{
	notification: UserNotification;
}> = ({ notification }) => {
	const [isOpen, setIsOpen] = React.useState(false);

	const { mutate: updateStatus, isPending: isUpdatingStatus } =
		useUpdateNotificationsStatuses({
			disableToasts: true, // user doesn't need to be aware of this mutation
		});

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				const shouldMarkAsRead =
					open &&
					notification.status === "unread" &&
					!isUpdatingStatus;
				if (shouldMarkAsRead) {
					updateStatus({
						ids: [notification.id],
						status: "read",
					});
				}
			}}>
			<DialogTrigger asChild>
				<Button className={"table-action-green"}>View</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>{notification.title}</DialogTitle>
					<div className="text-sm text-blue-700">
						{dayjs(notification.createdAt).fromNow()}
					</div>
					<DialogDescription className="text-base">
						{notification.message}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button className="bg-red-500">Delete</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export const MarkAsReadButton: React.FC<{
	notification: UserNotification & { status: "unread" };
}> = ({ notification }) => {
	const { mutate: updateStatus, isPending: isUpdatingStatus } =
		useUpdateNotificationsStatuses();

	return (
		<Button
			className={cn("table-action-green")}
			disabled={isUpdatingStatus}
			onClick={() => {
				updateStatus({ ids: [notification.id], status: "read" });
			}}>
			Mark as Read
		</Button>
	);
};

export const MarkAllAsReadButton: React.FC<{
	table: Table<UserNotification>;
}> = ({ table }) => {
	const { mutate: updateStatus, isPending: isUpdatingStatus } =
		useUpdateNotificationsStatuses();

	const selectedUnreadIds = (() => {
		const Ids: string[] = [];

		const selectedRows = table.getSelectedRowModel().rows;
		for (const row of selectedRows) {
			const notification = row.original;
			if (notification.status === "unread") {
				Ids.push(notification.id);
			}
		}

		return Ids;
	})();

	const hasMultipleSelections = selectedUnreadIds.length > 1;
	const isAllUnreadSelected =
		table.getIsAllPageRowsSelected() && selectedUnreadIds.length > 0;
	const numOfUnreadSelections = selectedUnreadIds.length;

	const shouldActivateMark = isAllUnreadSelected || hasMultipleSelections;

	return (
		<Button
			variant={shouldActivateMark ? "default" : "ghost"}
			size={shouldActivateMark ? "sm" : "default"}
			disabled={isUpdatingStatus || !shouldActivateMark}
			className={cn({
				"table-action-green": shouldActivateMark,
				"disabled:opacity-100": !isUpdatingStatus, // when marking all as read, allow the default disabled opacity
			})}
			onClick={() => {
				updateStatus({
					ids: selectedUnreadIds,
					status: "read",
				});
				table.resetRowSelection();
			}}>
			{isAllUnreadSelected
				? "Mark all as read"
				: hasMultipleSelections
					? `Mark selected (${numOfUnreadSelections}) as read`
					: "Mark as read"}{" "}
			{isUpdatingStatus && <LoadingIndicator />}
		</Button>
	);
};

export const DeleteButton: React.FC<{
	notification: UserNotification;
}> = ({ notification }) => {
	const { mutate: deleteNotification, isPending: isDeleting } =
		useDeleteNotifications();

	return (
		<Button
			className={cn("table-action-red")}
			disabled={isDeleting}
			onClick={() => {
				deleteNotification({ ids: [notification.id] });
			}}>
			Delete
		</Button>
	);
};

export const DeleteAllButton: React.FC<{
	table: Table<UserNotification>;
}> = ({ table }) => {
	const { mutate: deleteNotifications, isPending: isDeleting } =
		useDeleteNotifications();
	const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

	const selectedIds = table
		.getSelectedRowModel()
		.rows.map((row) => row.original.id);

	const isAllSelected = table.getIsAllPageRowsSelected();
	const hasMultipleSelections = selectedIds.length > 1;
	const numOfSelections = selectedIds.length;

	const getConfirmDescription = () => {
		if (isAllSelected) {
			return `Are you sure you want to delete all ${numOfSelections} notifications? This cannot be undone.`;
		}

		return `Are you sure you want to delete these ${numOfSelections} notifications? This cannot be undone.`;
	};

	const shouldActivateDelete = isAllSelected || hasMultipleSelections;

	return (
		<>
			<Button
				variant={shouldActivateDelete ? "default" : "ghost"}
				size={shouldActivateDelete ? "sm" : "default"}
				disabled={isDeleting || !shouldActivateDelete}
				className={cn({
					"table-action-red": shouldActivateDelete,
					"disabled:opacity-100": !isDeleting, // when deleting all, allow the default disabled opacity
				})}
				onClick={() => setIsConfirmingDelete(true)}>
				{isAllSelected
					? "Delete all"
					: hasMultipleSelections
						? `Delete selected (${numOfSelections})`
						: "Delete"}{" "}
				{isDeleting && <LoadingIndicator />}
			</Button>

			<CriticalActionConfirmationDialog
				open={isConfirmingDelete}
				onOpenChange={setIsConfirmingDelete}
				title="Delete Notifications"
				description={getConfirmDescription()}
				confirmText="delete"
				confirmButtonText="Delete"
				onConfirm={() => {
					deleteNotifications({ ids: selectedIds });
					table.resetRowSelection();
				}}
			/>
		</>
	);
};
