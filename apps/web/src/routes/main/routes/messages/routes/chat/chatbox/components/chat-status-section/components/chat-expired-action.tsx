/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer";
import { getErrorMessage } from "@/lib/utils";
import React from "react";
import { toast } from "sonner";
import { useChatDetails } from "../../../../hooks/use-chat-details";
import { useCooldownCountdown } from "../hooks/use-cooldown-countdown";
import { useExtendChatPeriod } from "../hooks/use-extend-chat-period";
import { useRetryExpiredChat } from "../hooks/use-retry-expired-chat";
import {
	ChatDrawer,
	ChatDrawerContent,
	ChatDrawerDescription,
	ChatDrawerFooter,
	ChatDrawerTitle,
} from "./chat-drawer";

interface ChatExpiredActionProps {
	title: string;
	description?: string;
}

export const ChatExpiredByMeAction: React.FC<ChatExpiredActionProps> = ({
	title,
	description,
}) => {
	const { data: chatDetails } = useChatDetails();
	const { mutate: extend, isPending: isExtending } = useExtendChatPeriod();
	const { mutate: retry, isPending: isRetrying } = useRetryExpiredChat();

	// Determine if we can extend or should retry
	const canExtend =
		chatDetails?.status === "EXPIRED" &&
		chatDetails.remainingExtensions > 0;
	const shouldRetry =
		chatDetails?.status === "EXPIRED" &&
		chatDetails.remainingExtensions === 0;

	// Get cooldown info for retry scenario
	const canRetryAt =
		chatDetails?.status === "EXPIRED" ? chatDetails.canRetryAt : undefined;
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
					{canExtend ? (
						<Button
							disabled={isExtending}
							onClick={() => {
								if (!chatDetails?.id) {
									toast.error("Chat not ready");
									return;
								}
								extend({ chatId: chatDetails.id });
							}}
							className="button">
							{isExtending ? (
								<>
									Extending <LoadingIndicator />
								</>
							) : (
								`Extend Conversation (${chatDetails.remainingExtensions} left)`
							)}
						</Button>
					) : shouldRetry ? (
						<Button
							disabled={isRetrying || cooldownActive}
							onClick={() => {
								retry(undefined, {
									onError: (e) => {
										toast.error(
											"Unable to resend request",
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
							) : isRetrying ? (
								<>
									Resending <LoadingIndicator />
								</>
							) : (
								"Resend Request"
							)}
						</Button>
					) : null}
				</ChatDrawerFooter>
			</ChatDrawerContent>
		</ChatDrawer>
	);
};

export const ChatExpiredByThemAction: React.FC<ChatExpiredActionProps> = ({
	title,
	description,
}) => {
	const { data: chatDetails } = useChatDetails();
	const { mutate: retry, isPending: isRetrying } = useRetryExpiredChat();

	// Get cooldown info
	const canRetryAt =
		chatDetails?.status === "EXPIRED" ? chatDetails.canRetryAt : undefined;
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
						disabled={isRetrying || cooldownActive}
						onClick={() => {
							retry(undefined, {
								onError: (e) => {
									toast.error("Unable to send request", {
										description: getErrorMessage(e),
									});
								},
							});
						}}
						className="button">
						{cooldownActive ? (
							`Wait ${remainingHours}h`
						) : isRetrying ? (
							<>
								Sending <LoadingIndicator />
							</>
						) : (
							"Send Request"
						)}
					</Button>
				</ChatDrawerFooter>
			</ChatDrawerContent>
		</ChatDrawer>
	);
};
