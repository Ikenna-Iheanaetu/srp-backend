/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer";
import { getErrorMessage } from "@/lib/utils";
import React from "react";
import { toast } from "sonner";
import { useChatDetails } from "../../../../hooks/use-chat-details";
import { useCooldownCountdown } from "../hooks/use-cooldown-countdown";
import { useReopenDeclinedChat } from "../hooks/use-reopen-declined-chat";
import {
	ChatDrawer,
	ChatDrawerContent,
	ChatDrawerDescription,
	ChatDrawerFooter,
	ChatDrawerTitle,
} from "./chat-drawer";

interface ChatDeclinedActionProps {
	title: string;
	description?: string;
}

export const ChatDeclinedByThemAction: React.FC<ChatDeclinedActionProps> = ({
	title,
	description,
}) => {
	const { mutate: resend, isPending: isResending } = useReopenDeclinedChat();

	// Get chat details and calculate cooldown
	const { data: chatDetails } = useChatDetails();
	const canRetryAt =
		chatDetails?.status === "DECLINED" ? chatDetails.canRetryAt : undefined;
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
						disabled={isResending || cooldownActive}
						onClick={() => {
							resend(undefined, {
								onError: (e) => {
									toast.error(
										"Unable to resend chat request",
										{
											description: getErrorMessage(e),
										},
									);
								},
							});
						}}
						className="button">
						{cooldownActive ? (
							`Wait ${remainingHours}h`
						) : isResending ? (
							<>
								Resending <LoadingIndicator />
							</>
						) : (
							"Resend Request"
						)}
					</Button>
				</ChatDrawerFooter>
			</ChatDrawerContent>
		</ChatDrawer>
	);
};

export const ChatDeclinedByMeAction: React.FC<ChatDeclinedActionProps> = ({
	title,
	description,
}) => {
	const { mutate: reopen, isPending: isReopening } = useReopenDeclinedChat();

	// Get chat details and calculate cooldown
	const { data: chatDetails } = useChatDetails();
	const canRetryAt =
		chatDetails?.status === "DECLINED" ? chatDetails.canRetryAt : undefined;
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
						disabled={isReopening || cooldownActive}
						onClick={() => {
							reopen(undefined, {
								onError: (e) => {
									toast.error(
										"Unable to resend chat request",
										{
											description: getErrorMessage(e),
										},
									);
								},
							});
						}}
						className="button">
						{cooldownActive ? (
							`Wait ${remainingHours}h`
						) : isReopening ? (
							<>
								Reopening <LoadingIndicator />
							</>
						) : (
							"Reopen chat"
						)}
					</Button>
				</ChatDrawerFooter>
			</ChatDrawerContent>
		</ChatDrawer>
	);
};
