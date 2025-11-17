/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { EntityProfileParams } from "@/routes/main/routes/entity/schemas";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { href, useLocation } from "react-router";
import {
	Chat,
	ChatContent,
	ChatHeader,
	ChatRecipientInfo,
} from "../../../../components/chat";
import {
	MessageAttachmentsList,
	MessageBubble,
	MessageDeliveryStatus,
	MessageDocumentAttachmentDisplay,
	MessageFeed,
	MessageFooter,
	MessageImageAttachmentDisplay,
	MessageItem,
	MessageTimestamp,
} from "../../../../components/chat/message-feed";
import { useFileToAttachment } from "../../../chat/hooks/use-file-to-attachment";
import { ChatRecipient, RenderableMsgFromClient } from "../../../chat/types";
import { getDb } from "../../db";
import { useSelectedRecipientId } from "../../hooks/use-selected-recipient-id";
import { ComposerSection } from "./composer-section";

interface NewChatProps {
	recipient: ChatRecipient;
	className?: string;
}

export const NewChat: React.FC<NewChatProps> = ({ recipient, className }) => {
	const currentLocation = useLocation();
	const [, setSelectedRecipientId] = useSelectedRecipientId();

	const { getAttachmentFrom } = useFileToAttachment();
	const newMessage: RenderableMsgFromClient | undefined =
		useLiveQuery(async () => {
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
		}, [recipient.id]);

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Button
				onClick={() => void setSelectedRecipientId({ recipientId: null })}
				variant={"ghost"}
				className="self-start lg:hidden">
				<ArrowLeft /> Recipients
			</Button>

			<Chat className="flex-1">
				<ChatHeader>
				<div className="sr-only">
					<CardTitle>
						<h3>
							You're about to start a new chat with{" "}
							{recipient.name}
						</h3>
					</CardTitle>
					<CardDescription>
						<p>When chat is initiated, it'll expire in 27 days.</p>
					</CardDescription>
				</div>

				<LinkButton
					disableDefaultStyles
					variant={"ghost"}
					to={href("/:userType/:id", {
						userType:
							recipient.userType as EntityProfileParams["userType"], // some user types don't have 3rd party profile implemented yet
						id: recipient.id,
					} satisfies EntityProfileParams)}
					state={
						{
							crumbs: [
								{
									label: "New Chat",
									to: currentLocation,
								},
								{
									label: recipient.name,
								},
							],
						} satisfies CrumbsLocationState
					}
					className="size-fit p-0">
					<ChatRecipientInfo recipient={recipient} />
				</LinkButton>
			</ChatHeader>

			<ChatContent>
				<MessageFeed>
					{newMessage && (
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
					)}
				</MessageFeed>

				<ComposerSection recipient={recipient} />
			</ChatContent>
		</Chat>
		</div>
	);
};
