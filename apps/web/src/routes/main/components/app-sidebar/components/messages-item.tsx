/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { removeTrailingSlash } from "@/lib/helper-functions/generic-string-helpers";
import {
	chatSocket,
	EventReceiveResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { ChatAlertCount } from "@/routes/main/routes/messages/components/chat";
import { chatQueries } from "@/routes/main/routes/messages/routes/chat/query-factory";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import React from "react";
import { href, Link, useLocation } from "react-router";
import { toast } from "sonner";
import {
	CrumbItem,
	Crumbs,
	CrumbsLocationState,
	isStateWithCrumbs,
} from "../../app-header/bread-crumb-navigation";
import {
	TopSidebarMenuButton,
	TopSidebarMenuIcon,
	TopSidebarMenuItem,
	TopSidebarMenuLabel,
} from "./top-sidebar-menu";
import { cn } from "@repo/shared";

const useListenForNewChatRequest = () => {
	const currentLocation = useLocation();
	const currentPath = removeTrailingSlash(currentLocation.pathname);

	const onChatRequestReceived = React.useEffectEvent(
		(chat: EventReceiveResponse<"chat:request-received">) => {
			const chatPath = href("/messages/:id", {
				id: chat.id,
			});

			// Don't show toast if already viewing this specific chat
			if (currentPath !== chatPath) {
				return;
			}

			const senderName = chat.recipient.name;
			const senderAvatar = chat.recipient.avatar;

			const getCrumbs = (): Crumbs => {
				let crumbs: Crumbs = [
					{ to: chatPath, label: `Chat with ${senderName}` },
				];
				if (isStateWithCrumbs(currentLocation.state)) {
					const currentCrumbs = currentLocation.state.crumbs;
					const lastCrumb = currentCrumbs[currentCrumbs.length - 1];
					if (lastCrumb) {
						const firstCrumbForTarget: CrumbItem = {
							...lastCrumb,
							to: currentLocation,
							path: undefined,
						};
						crumbs = [firstCrumbForTarget, ...crumbs];
					}
				}
				return crumbs;
			};

			const toastId = toast.info(
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<Avatar className="size-10">
							<AvatarImage src={senderAvatar} alt={senderName} />
							<AvatarFallback>{senderName}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col">
							<span className="font-semibold">{senderName}</span>
							<span className="text-sm text-slate-500">
								sent you a chat request
							</span>
						</div>
					</div>

					<LinkButton
						onClick={() => toast.dismiss(toastId)}
						to={href("/messages")}
						state={
							{
								crumbs: getCrumbs(),
							} satisfies CrumbsLocationState
						}
						className="!p-2">
						View Request
					</LinkButton>
				</div>,
				{ position: "top-center", duration: 8000 },
			);
		},
	);

	React.useEffect(() => {
		chatSocket.on("chat:request-received", onChatRequestReceived);

		return () => {
			chatSocket.off("chat:request-received", onChatRequestReceived);
		};
	}, []);
};

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
	useListenForNewChatRequest();
	useListenForUnattendedCountUpdate();
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
