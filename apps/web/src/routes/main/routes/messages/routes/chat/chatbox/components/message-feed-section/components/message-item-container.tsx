/** @format */

import {
	MessageAttachmentsList,
	MessageBubble,
	MessageDeliveryStatus,
	MessageDocumentAttachmentDisplay,
	MessageFailedControlItem,
	MessageFailedControlMenu,
	MessageFooter,
	MessageImageAttachmentDisplay,
	MessageItem,
	MessageItemContextType,
	MessageTimestamp,
} from "@/routes/main/routes/messages/components/chat/message-feed";
import { useMarkMessageAsRead } from "../hooks/use-mark-message-as-read";
import { getDb } from "../../../../db";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { useSendNewMessage } from "../../../hooks/use-send-new-message";
import { useChatRoom } from "../../../../chat-room-context";
import { RotateCw, Trash2 } from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useChatDetails } from "../../../../hooks/use-chat-details";
import React from "react";

export const MessageItemContainer = (
	props: {
		className?: string;
		ref?: React.Ref<HTMLDivElement>;
	} & MessageItemContextType,
) => {
	const { message } = props;
	const setOnSeenRef = useMarkMessageAsRead(props.message);

	const failedToSend = message.status === "FAILED";
	const deleteFailedMsg = async () => {
		if (!failedToSend) {
			return;
		}
		try {
			const db = getDb();
			await db.deleteMessage(message.id);
		} catch (e) {
			toast.error("Unable to delete message", {
				description: getErrorMessage(e),
			});
		}
	};

	const { mutate: sendNewMsg } = useSendNewMessage();
	const { roomId } = useChatRoom();
	const resendFailedMsg = async () => {
		if (!failedToSend) {
			return;
		}
		try {
			const db = getDb();
			const storedMsg = await db.getMessage(message.id);
			if (!storedMsg) {
				throw new Error("Unable the retrieve the failed message.");
			}

			if (!roomId) {
				throw new Error("Chat room not ready");
			}

			await db.updateMessageStatus(storedMsg.id, "SENDING");

			sendNewMsg(storedMsg, {
				onSuccess: () => {
					void getDb().deleteMessage(storedMsg.id);
				},
				onError: () => {
					void getDb().updateMessageStatus(storedMsg.id, "FAILED");
				},
			});
		} catch (error) {
			toast.error("Unable to resend message", {
				description: getErrorMessage(error),
			});
		}
	};

	const { data: chatDetails } = useChatDetails();
	const canResendMsg =
		message.status === "FAILED" && chatDetails?.status === "ACCEPTED";

	return (
		<MessageFailedControlMenu
			message={message}
			menuTrigger={
				<MessageItem
					{...props}
					ref={(node) => {
						const onSeenCleanup = setOnSeenRef(node);
						let externalRefCleanup: void | (() => void);
						if (typeof props.ref === "function") {
							externalRefCleanup = props.ref(node);
						} else {
							if (props.ref) {
								props.ref.current = node;
							}
						}

						return () => {
							onSeenCleanup?.();
							externalRefCleanup?.();
						};
					}}>
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
			{canResendMsg && (
				<MessageFailedControlItem
					onClick={() => void resendFailedMsg()}>
					<RotateCw className="mr-1" /> Resend
				</MessageFailedControlItem>
			)}

			<DropdownMenuSeparator />

			<MessageFailedControlItem
				className="text-red-500"
				onClick={() => void deleteFailedMsg()}>
				<Trash2 className="mr-1 text-red-500" /> Delete
			</MessageFailedControlItem>
		</MessageFailedControlMenu>
	);
};
