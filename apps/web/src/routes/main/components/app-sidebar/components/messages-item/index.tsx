/** @format */

import { removeTrailingSlash } from "@/lib/helper-functions/generic-string-helpers";
import {
	chatSocket,
	EventReceiveResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { ChatAlertCount } from "@/routes/main/routes/messages/components/chat";
import { chatQueries } from "@/routes/main/routes/messages/routes/chat/query-factory";
import { cn } from "@repo/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import React from "react";
import { href, Link, useLocation } from "react-router";
import {
	TopSidebarMenuButton,
	TopSidebarMenuIcon,
	TopSidebarMenuItem,
	TopSidebarMenuLabel,
} from "../top-sidebar-menu";
import { useListenForChatAcceptance } from "./hooks/use-listen-for-chat-acceptance";
import { useListenForChatEnded } from "./hooks/use-listen-for-chat-ended";
import { useListenForChatExpiredUpdates } from "./hooks/use-listen-for-chat-expired-updates";
import { useListenForDeclinedRetried } from "./hooks/use-listen-for-declined-retried";
import { useListenForEndedRetried } from "./hooks/use-listen-for-ended-retried";
import { useListenForExpiredRetried } from "./hooks/use-listen-for-expired-retried";
import { useListenForNewChatRequest } from "./hooks/use-listen-for-new-chat-request";

const useListenForUnattendedCountUpdate = () => {
	const queryClient = useQueryClient();
	const onUnattendedCountUpdate = React.useEffectEvent(
		(count: EventReceiveResponse<"chat:unattended-count">) => {
			const { queryKey } = chatQueries.unattendedCount();
			queryClient.setQueryData(queryKey, count);
		},
	);

	React.useEffect(() => {
		chatSocket.on("chat:unattended-count", onUnattendedCountUpdate);

		return () => {
			chatSocket.off("chat:unattended-count", onUnattendedCountUpdate);
		};
	}, []);
};

export const MessagesItem = ({ className }: { className?: string }) => {
	useListenForChatAcceptance();
	useListenForChatExpiredUpdates();
	useListenForChatEnded();
	useListenForDeclinedRetried();
	useListenForEndedRetried();
	useListenForExpiredRetried();
	useListenForNewChatRequest();
	useListenForUnattendedCountUpdate();

	// setup chat socket
	React.useEffect(() => {
		chatSocket.connect();
		const heartbeatInterval = setInterval(() => {
			if (chatSocket.connected) {
				chatSocket.emit("heartbeat");
			}
		}, 20000);

		const onDisconnect = () => {
			// This connection must remain active as longer as the component is mounted
			chatSocket.connect();
		};
		chatSocket.on("disconnect", onDisconnect);

		return () => {
			clearInterval(heartbeatInterval);

			// first remove disconnect listener
			chatSocket.off("disconnect", onDisconnect);

			// NOTE: chatSocket is disconnected here cause unmounting this component means main application layer was unmounted
			chatSocket.disconnect();
		};
	}, []);

	const { pathname } = useLocation();
	const currentRoute = removeTrailingSlash(pathname);

	const { data: unattendedCount = 0 } = useQuery(
		chatQueries.unattendedCount(),
	);

	const chatsPath = href("/messages");

	return (
		<TopSidebarMenuItem className={cn(className)}>
			<TopSidebarMenuButton
				asChild
				isActive={currentRoute.startsWith(chatsPath)}>
				<Link to={chatsPath}>
					<TopSidebarMenuIcon Icon={Mail} />
					<TopSidebarMenuLabel>Messages</TopSidebarMenuLabel>
					{unattendedCount > 0 && (
						<ChatAlertCount
							role="status"
							aria-label={`${unattendedCount} unattended items`}
							className="ml-auto">
							{unattendedCount}
						</ChatAlertCount>
					)}
				</Link>
			</TopSidebarMenuButton>
		</TopSidebarMenuItem>
	);
};
