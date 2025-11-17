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

export const useListenForChatEnded = () => {
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

	const onEnded = React.useEffectEvent(
		(chat: EventReceiveResponse<"chat:ended">) => {
			const chatPath = href("/messages/:id", {
				id: chat.id,
			});

			const isAlreadyInChat = currentPath === chatPath;
			if (!isAlreadyInChat) {
				const recipientName = chat.recipient.name;
				const recipientAvatar = chat.recipient.avatar;

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
								<ChatToastTitle>{recipientName}</ChatToastTitle>
								<ChatToastDescription>
									ended your chat with them.
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
				const canTransitionToEnded = old.status === "ACCEPTED";
				if (!canTransitionToEnded) {
					return old;
				}

				return chat;
			});
		},
	);

	React.useEffect(() => {
		chatSocket.on("chat:ended", onEnded);

		return () => {
			chatSocket.off("chat:ended", onEnded);
		};
	}, []);
};
