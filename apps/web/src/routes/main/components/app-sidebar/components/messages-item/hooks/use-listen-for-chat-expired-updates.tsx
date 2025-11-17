/** @format */

import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { removeTrailingSlash } from "@/lib/helper-functions/generic-string-helpers";
import {
	Crumbs,
	CrumbsLocationState,
} from "@/routes/main/components/app-header/bread-crumb-navigation";
import {
	chatSocket,
	EventReceiveResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { chatQueries } from "@/routes/main/routes/messages/routes/chat/query-factory";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { href, To, useLocation } from "react-router";
import { toast } from "sonner";
import {
	CHAT_TOAST_CONFIG,
	ChatToast,
	ChatToastAvatar,
	ChatToastContent,
	ChatToastDescription,
	ChatToastDetails,
	ChatToastLinkAction,
	ChatToastTitle,
} from "../components/chat-toast";
import { useLastCrumbHandover } from "./use-last-crumb-handover";

export const useListenForChatExpiredUpdates = () => {
	const queryClient = useQueryClient();
	const currentLocation = useLocation();
	const currentPath = removeTrailingSlash(currentLocation.pathname);
	const firstCrumbForTarget = useLastCrumbHandover();
	const getCrumbs = (chatPath: To, senderName: string): Crumbs => {
		const crumbs: Crumbs = [
			{ to: chatPath, label: `Chat with ${senderName}` },
		];
		if (firstCrumbForTarget) {
			crumbs.unshift(firstCrumbForTarget);
		}
		return crumbs;
	};

	const onExpired = React.useEffectEvent(
		(chat: EventReceiveResponse<"chat:expired">) => {
			const chatPath = href("/messages/:id", {
				id: chat.id,
			});

			const isAlreadyInChat = currentPath === chatPath;
			if (!isAlreadyInChat) {
				const recipientName = chat.recipient.name;
				const recipientAvatar = chat.recipient.avatar;
				const canExtendChatPeriod =
					chat.initiatedBy === "ME" && chat.remainingExtensions > 0;

				const toastId = toast.warning(
					<ChatToast>
						<ChatToastContent>
							<ChatToastAvatar>
								<AvatarImage
									src={recipientAvatar}
									alt={recipientName}
								/>
								<AvatarFallback>{recipientName}</AvatarFallback>
							</ChatToastAvatar>

							<ChatToastDetails>
								<ChatToastTitle>Chat expired</ChatToastTitle>
								<ChatToastDescription>
									Your chat with {recipientName} has expired.{" "}
									{canExtendChatPeriod &&
										"You can extend the period."}
								</ChatToastDescription>
							</ChatToastDetails>
						</ChatToastContent>

						<ChatToastLinkAction
							onClick={() => toast.dismiss(toastId)}
							to={chatPath}
							state={
								{
									crumbs: getCrumbs(chatPath, recipientName),
								} satisfies CrumbsLocationState
							}>
							View chat
						</ChatToastLinkAction>
					</ChatToast>,
					CHAT_TOAST_CONFIG,
				);
			}

			// update chat details query cache
			const { queryKey } = chatQueries.chatDetails(chat.id);
			queryClient.setQueryData(queryKey, (old) => {
				if (!old) {
					return chat;
				}
				const canTransitionToExpired = old.status === "ACCEPTED";
				if (!canTransitionToExpired) {
					return old;
				}

				return chat;
			});
		},
	);

	const onExtended = React.useEffectEvent(
		(chat: EventReceiveResponse<"chat:extended">) => {
			const chatPath = href("/messages/:id", {
				id: chat.id,
			});

			const isAlreadyInChat = currentPath === chatPath;
			if (!isAlreadyInChat) {
				const recipientName = chat.recipient.name;
				const recipientAvatar = chat.recipient.avatar;

				const toastId = toast.info(
					<ChatToast>
						<ChatToastContent>
							<ChatToastAvatar>
								<AvatarImage
									src={recipientAvatar}
									alt={recipientName}
								/>
								<AvatarFallback>{recipientName}</AvatarFallback>
							</ChatToastAvatar>

							<ChatToastDetails>
								<ChatToastTitle>{recipientName}</ChatToastTitle>
								<ChatToastDescription>
									has extended the chat period.
								</ChatToastDescription>
							</ChatToastDetails>
						</ChatToastContent>

						<ChatToastLinkAction
							onClick={() => toast.dismiss(toastId)}
							to={chatPath}
							state={
								{
									crumbs: getCrumbs(chatPath, recipientName),
								} satisfies CrumbsLocationState
							}>
							View chat
						</ChatToastLinkAction>
					</ChatToast>,
					CHAT_TOAST_CONFIG,
				);
			}

			// update chat details query cache
			const { queryKey } = chatQueries.chatDetails(chat.id);
			queryClient.setQueryData(queryKey, (old) => {
				if (!old) {
					return chat;
				}
				const canTransitionToAccepted =
					old.status === "EXPIRED" && old.initiatedBy === "THEM";
				if (!canTransitionToAccepted) {
					return old;
				}

				return chat;
			});
		},
	);

	React.useEffect(() => {
		chatSocket.on("chat:expired", onExpired);
		chatSocket.on("chat:extended", onExtended);

		return () => {
			chatSocket.off("chat:expired", onExpired);
			chatSocket.off("chat:extended", onExtended);
		};
	}, []);
};
