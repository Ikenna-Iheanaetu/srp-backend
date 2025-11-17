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

export const useListenForChatAcceptance = () => {
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

	const onAccepted = React.useEffectEvent(
		(chat: EventReceiveResponse<"chat:accepted">) => {
			const chatPath = href("/messages/:id", {
				id: chat.id,
			});

			const isAlreadyInChat = currentPath === chatPath;
			if (!isAlreadyInChat) {
				const senderName = chat.recipient.name;
				const senderAvatar = chat.recipient.avatar;

				const toastId = toast.info(
					<ChatToast>
						<ChatToastContent>
							<ChatToastAvatar>
								<AvatarImage
									src={senderAvatar}
									alt={senderName}
								/>
								<AvatarFallback>{senderName}</AvatarFallback>
							</ChatToastAvatar>

							<ChatToastDetails>
								<ChatToastTitle>{senderName}</ChatToastTitle>
								<ChatToastDescription>
									accepted your chat request
								</ChatToastDescription>
							</ChatToastDetails>
						</ChatToastContent>

						<ChatToastLinkAction
							onClick={() => toast.dismiss(toastId)}
							to={chatPath}
							state={
								{
									crumbs: getCrumbs(chatPath, senderName),
								} satisfies CrumbsLocationState
							}>
							View chat
						</ChatToastLinkAction>
					</ChatToast>,
					CHAT_TOAST_CONFIG,
				);
			}

			// update chat details query cache
			const queryKey = chatQueries.chatDetails(chat.id).queryKey;
			queryClient.setQueryData(queryKey, (old) => {
				if (!old) {
					return chat;
				}

				const canTransition =
					old?.status === "PENDING" && old.initiatedBy === "ME";
				if (!canTransition) {
					return old;
				}

				return chat;
			});
		},
	);

	const onDeclined = React.useEffectEvent(
		(chat: EventReceiveResponse<"chat:declined">) => {
			const chatPath = href("/messages/:id", {
				id: chat.id,
			});

			const isAlreadyInChat = currentPath === chatPath;
			if (!isAlreadyInChat) {
				const senderName = chat.recipient.name;
				const senderAvatar = chat.recipient.avatar;

				const toastId = toast.warning(
					<ChatToast>
						<ChatToastContent>
							<ChatToastAvatar>
								<AvatarImage
									src={senderAvatar}
									alt={senderName}
								/>
								<AvatarFallback>{senderName}</AvatarFallback>
							</ChatToastAvatar>

							<ChatToastDetails>
								<ChatToastTitle>{senderName}</ChatToastTitle>
								<ChatToastDescription>
									declined your chat request
								</ChatToastDescription>
							</ChatToastDetails>
						</ChatToastContent>

						<ChatToastLinkAction
							onClick={() => toast.dismiss(toastId)}
							to={chatPath}
							state={
								{
									crumbs: getCrumbs(chatPath, senderName),
								} satisfies CrumbsLocationState
							}>
							View chat
						</ChatToastLinkAction>
					</ChatToast>,
					CHAT_TOAST_CONFIG,
				);
			}

			// update chat details query cache
			const queryKey = chatQueries.chatDetails(chat.id).queryKey;
			queryClient.setQueryData(queryKey, (old) => {
				if (!old) {
					return chat;
				}

				const canTransition =
					old?.status === "PENDING" && old.initiatedBy === "ME";
				if (!canTransition) {
					return old;
				}

				return chat;
			});
		},
	);

	React.useEffect(() => {
		chatSocket.on("chat:accepted", onAccepted);
		chatSocket.on("chat:declined", onDeclined);

		return () => {
			chatSocket.off("chat:accepted", onAccepted);
			chatSocket.off("chat:declined", onDeclined);
		};
	}, []);
};
