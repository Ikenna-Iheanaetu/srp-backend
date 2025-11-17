/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer";
import { getErrorMessage } from "@/lib/utils";
import React from "react";
import { toast } from "sonner";
import { useChatDetails } from "../../../../hooks/use-chat-details";
import { useCooldownCountdown } from "../hooks/use-cooldown-countdown";
import { useReactivateEndedChat } from "../hooks/use-reactivate-ended-chat";
import {
	ChatDrawer,
	ChatDrawerContent,
	ChatDrawerDescription,
	ChatDrawerFooter,
	ChatDrawerTitle,
} from "./chat-drawer";

interface ChatEndedActionProps {
	title: string;
	description?: string;
}

export const ChatEndedByThemAction: React.FC<ChatEndedActionProps> = ({
	title,
	description,
}) => {
	const { mutate: reactivate, isPending: isReactivating } =
		useReactivateEndedChat();

	// Get chat details and calculate cooldown
	const { data: chatDetails } = useChatDetails();
	const canRetryAt =
		chatDetails?.status === "ENDED" ? chatDetails.canRetryAt : undefined;
	const remainingHours = useCooldownCountdown(canRetryAt);
	const cooldownActive = remainingHours > 0;

	return (
		<ChatDrawer>
			<ChatDrawerContent>
				<DrawerHeader>
					<ChatDrawerTitle>{title}</ChatDrawerTitle>
					<ChatDrawerDescription>{description}</ChatDrawerDescription>
				</DrawerHeader>

				<ChatDrawerFooter>
					<Button
						disabled={isReactivating || cooldownActive}
						onClick={() => {
							reactivate(undefined, {
								onError: (e) => {
									toast.error("Unable to reactivate chat", {
										description: getErrorMessage(e),
									});
								},
							});
						}}
						className="button">
						{cooldownActive ? (
							`Wait ${remainingHours}h`
						) : isReactivating ? (
							<>
								Reactivating <LoadingIndicator />
							</>
						) : (
							"Reactivate Chat"
						)}
					</Button>
				</ChatDrawerFooter>
			</ChatDrawerContent>
		</ChatDrawer>
	);
};

export const ChatEndedByMeAction: React.FC<ChatEndedActionProps> = ({
	title,
	description,
}) => {
	const { mutate: reactivate, isPending: isReactivating } =
		useReactivateEndedChat();

	// Get chat details and calculate cooldown
	const { data: chatDetails } = useChatDetails();
	const canRetryAt =
		chatDetails?.status === "ENDED" ? chatDetails.canRetryAt : undefined;
	const remainingHours = useCooldownCountdown(canRetryAt);
	const cooldownActive = remainingHours > 0;

	return (
		<ChatDrawer>
			<ChatDrawerContent>
				<DrawerHeader>
					<ChatDrawerTitle>{title}</ChatDrawerTitle>
					<ChatDrawerDescription>{description}</ChatDrawerDescription>
				</DrawerHeader>

				<ChatDrawerFooter>
					<Button
						disabled={isReactivating || cooldownActive}
						onClick={() => {
							reactivate(undefined, {
								onError: (e) => {
									toast.error("Unable to reactivate chat", {
										description: getErrorMessage(e),
									});
								},
							});
						}}
						className="button">
						{cooldownActive ? (
							`Wait ${remainingHours}h`
						) : isReactivating ? (
							<>
								Reactivating <LoadingIndicator />
							</>
						) : (
							"Reactivate Chat"
						)}
					</Button>
				</ChatDrawerFooter>
			</ChatDrawerContent>
		</ChatDrawer>
	);
};
