/** @format */

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn, getErrorMessage } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { RotateCw, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import {
	MessageAttachmentsList,
	MessageBubble,
	MessageDeliveryStatus,
	MessageDocumentAttachmentDisplay,
	MessageFailedControlItem,
	MessageFailedControlMenu,
	MessageFeed,
	MessageFooter,
	MessageImageAttachmentDisplay,
	MessageItem,
	MessageTimestamp,
} from "../../../../components/chat/message-feed";
import { useFileToAttachment } from "../../../chat/hooks/use-file-to-attachment";
import { ChatRecipient, RenderableMsgFromClient } from "../../../chat/types";
import { getDb } from "../../db";
import { useInitiateChat } from "./use-initiate-chat";

interface FeedSectionProps {
	recipient: ChatRecipient;
	className?: string;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
	recipient,
	className,
}) => {
	const { getAttachmentFrom } = useFileToAttachment();
	const newMessage = useLiveQuery(async () => {
		const db = getDb();
		const [message] = await db.getRecipientMessages(recipient.id);

		if (message) {
			const { recipientId: _, attachments, ...rest } = message;
			return {
				...rest,
				attachments: attachments?.map((file) =>
					getAttachmentFrom(file),
				),
			} as RenderableMsgFromClient;
		}
	}, [recipient]);

	const handleDeleteMsg = async () => {
		try {
			const db = getDb();
			await db.deleteRecipientMessages(recipient.id);
		} catch (e) {
			toast.error("Unable to delete message", {
				description: getErrorMessage(e),
			});
		}
	};

	const { mutate: initiateChat } = useInitiateChat();
	const handleResendMsg = async () => {
		try {
			const db = getDb();
			const [msg] = await db.getRecipientMessages(recipient.id);
			if (!msg) {
				throw new Error("No unsent message exists for this recipient");
			}

			await db.updateMessageStatus(msg.id, "SENDING");

			initiateChat(
				{ recipient, message: msg },
				{
					onSuccess: () => {
						void db.deleteRecipientMessages(recipient.id);
					},
					onError: () => {
						void db.updateMessageStatus(msg.id, "FAILED");
					},
				},
			);
		} catch (error) {
			toast.error("Unable to resend message", {
				description: getErrorMessage(error),
			});
		}
	};

	return (
		<MessageFeed className={cn("", className)}>
			{newMessage && (
				<MessageFailedControlMenu
					message={newMessage}
					menuTrigger={
						<MessageItem message={newMessage} isLastInBlock={true}>
							<MessageBubble />
							<MessageAttachmentsList category="DOCUMENT">
								{(attachments) =>
									attachments.map((attachment) => {
										return (
											<MessageDocumentAttachmentDisplay
												key={attachment.url}
												attachment={attachment}
											/>
										);
									})
								}
							</MessageAttachmentsList>
							<MessageAttachmentsList category="IMAGE">
								{(attachments) =>
									attachments.map((attachment) => {
										return (
											<MessageImageAttachmentDisplay
												key={attachment.url}
												attachment={attachment}
											/>
										);
									})
								}
							</MessageAttachmentsList>
							<MessageFooter>
								<MessageTimestamp />
								<MessageDeliveryStatus />
							</MessageFooter>
						</MessageItem>
					}>
					<MessageFailedControlItem
						onClick={() => void handleResendMsg()}>
						<RotateCw className="mr-1" /> Resend
					</MessageFailedControlItem>

					<DropdownMenuSeparator />

					<MessageFailedControlItem
						className="text-red-500"
						onClick={() => void handleDeleteMsg()}>
						<Trash2 className="mr-1 text-red-500" /> Delete
					</MessageFailedControlItem>
				</MessageFailedControlMenu>
			)}
		</MessageFeed>
	);
};
