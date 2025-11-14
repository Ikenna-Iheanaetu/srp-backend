/** @format */

import { Button } from "@/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	notificationsQueries,
	NotificationsQueryParams,
} from "@/routes/main/routes/notifications/query-factory";
import { useUpdateNotificationsStatuses } from "@/routes/main/routes/notifications/table/hooks/use-update-notifications-status";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Bell } from "lucide-react";
import { type FC, useState } from "react";
import { href } from "react-router";
import { NavIconButton } from "../nav-icon-button";
import { NotificationCardItem } from "./card-item";

dayjs.extend(relativeTime);

const NotificationsSkeleton: FC = () => {
	return Array(3)
		.fill(0)
		.map((_, index) => (
			<li key={`skeleton-${index}`} className="p-2">
				<div className="flex items-start gap-2">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-3 w-20" />
					</div>
				</div>
			</li>
		));
};

export const NotificationsHoverCard: FC = () => {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const queryParams = {
		status: ["unread"],
		limit: 5,
		page: 1,
	} satisfies RequireKeys<
		NotificationsQueryParams,
		"limit" | "status" | "page"
	>;

	const { data, isLoading } = useQuery(
		notificationsQueries.notifications(queryParams),
	);

	// Mutation hooks
	const { mutate: markAsRead, isPending: isMarkingAsRead } =
		useUpdateNotificationsStatuses({ queryParams });

	const notifications = data?.data ?? [];

	const handleToggleSelect = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id)
				? prev.filter((item) => item !== id)
				: [...prev, id],
		);
	};

	const handleSelectAll = () => {
		if (notifications.length === selectedIds.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(
				notifications.map((notification) => notification.id),
			);
		}
	};

	const handleMarkAsRead = () => {
		if (selectedIds.length > 0) {
			markAsRead({ ids: selectedIds, status: "read" });
			setSelectedIds([]);
		}
	};

	const isAnySelected = selectedIds.length > 0;

	const isAllSelected =
		notifications.length > 0 && selectedIds.length === notifications.length;

	const hasNotifications = !!notifications.length;

	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<NavIconButton
					to={href("/notifications")}
					icon={Bell}
					className="relative">
					{hasNotifications && (
						<div className="absolute right-0 top-0 size-2 -translate-y-1/2 translate-x-1/2 animate-pulse rounded-full bg-green-500" />
					)}
				</NavIconButton>
			</HoverCardTrigger>

			<HoverCardContent className="relative z-50 max-h-[80dvh] flex-col overflow-auto pt-0 scrollbar-track-transparent scrollbar-thumb-transparent tw-scrollbar">
				{/* header */}
				<div className="sticky top-0 z-10 flex-col gap-1 bg-white py-2">
					<h3 className="font-medium">Notifications</h3>

					<div className="flex gap-1 text-lime-400">
						<Button
							type="button"
							variant="ghost"
							disabled={!isAnySelected || isMarkingAsRead}
							onClick={handleMarkAsRead}>
							Mark as read
						</Button>

						<Button
							type="button"
							variant="ghost"
							disabled={notifications.length === 0}
							onClick={handleSelectAll}>
							{isAllSelected ? "Deselect all" : "Select all"}
						</Button>
					</div>
				</div>

				{/* notification cards */}
				<ul className="flex h-full flex-1 flex-col gap-2">
					{isLoading ? (
						<NotificationsSkeleton />
					) : notifications.length === 0 ? (
						<li className="text-muted-foreground p-4 text-center">
							No new notifications
						</li>
					) : (
						notifications.map((notification) => (
							<li key={notification.id}>
								<NotificationCardItem
									notification={notification}
									isSelected={selectedIds.includes(
										notification.id,
									)}
									onToggleSelect={() =>
										handleToggleSelect(notification.id)
									}
								/>
							</li>
						))
					)}
				</ul>
			</HoverCardContent>
		</HoverCard>
	);
};
