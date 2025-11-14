/** @format */

import { CheckboxStyled } from "@/components/common/checkbox-styled";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { createColumnConfigHelper } from "@/components/data-table-filter/core/filters";
import { Badge } from "@/components/ui/badge";
import { BazzaQueryFilters } from "@/types/tanstack-table";
import { ColumnDef } from "@tanstack/react-table";
import { Mail } from "lucide-react";
import {
	DeleteAllButton,
	DeleteButton,
	MarkAllAsReadButton,
	MarkAsReadButton,
	ViewNotificationModal,
} from "./components";

export type UserNotification = {
	id: string;
	userId: string;
	title: string;
	message: string;
	createdAt: string;
	updatedAt: string;
} & ({ status: "read" } | { status: "unread" });

export const columns: ColumnDef<UserNotification>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<CheckboxStyled
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) =>
					table.toggleAllPageRowsSelected(!!value)
				}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<CheckboxStyled
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
	},
	{
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => <TruncatedTextCell value={row.original.title} />,
	},
	{
		id: "view",
		header: "View",
		cell: ({ row }) => (
			<ViewNotificationModal notification={row.original} />
		),
	},
	{
		id: "markAsRead",
		header: ({ table }) => <MarkAllAsReadButton table={table} />,
		cell: ({ row }) => {
			const notification = row.original;
			if (notification.status === "read") {
				return <Badge variant={"secondary"}>Seen</Badge>;
			}
			return <MarkAsReadButton notification={notification} />;
		},
	},
	{
		id: "delete",
		header: ({ table }) => <DeleteAllButton table={table} />,
		cell: ({ row }) => (
			<DeleteButton notification={row.original} key={row.original.id} />
		),
	},
];

const dtf = createColumnConfigHelper<UserNotification>();

export const filters = [
	dtf
		.option()
		.id("status")
		.displayName("Status")
		.accessor((row) => row.status)
		.options(
			(["read", "unread"] satisfies UserNotification["status"][]).map(
				(value) => ({
					value,
					label: "",
					icon: (
						<Badge variant={"secondary"} className="capitalize">
							{value}
						</Badge>
					),
				}),
			),
		)
		.icon(Mail)
		.build(),
] as const;

export type NotificationFilters = BazzaQueryFilters<typeof filters>;
