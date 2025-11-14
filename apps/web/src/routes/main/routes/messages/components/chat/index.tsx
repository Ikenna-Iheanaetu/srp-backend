/** @format */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { File, User } from "lucide-react";
import React from "react";
import { CHATBOX_CONTAINER_ID } from "../../routes/chat/chatbox/constants";
import { ChatRecipient, MessageAttachment } from "../../routes/chat/types";
import { getMIMETypeLabel } from "../../routes/chat/utils";

const Chat: React.FC<React.ComponentProps<typeof Card>> = ({
	className,
	...props
}) => (
	<Card
		id={
			// NOTE: This is very important, for chat drawers to render under this container
			CHATBOX_CONTAINER_ID
		}
		{...props}
		className={cn("flex size-full flex-col gap-4 p-4", className)}
	/>
);

const ChatHeader: React.FC<React.ComponentProps<typeof CardHeader>> = ({
	className,
	...props
}) => <CardHeader {...props} className={cn("flex-row p-0", className)} />;

const ChatStatusBadge = ({
	className,
	...props
}: React.ComponentProps<typeof Badge>) => (
	<Badge
		{...props}
		className={cn(
			"whitespace-nowrap border border-slate-100 bg-slate-50 text-slate-500 shadow-none hover:bg-slate-100",
			className,
		)}
	/>
);

interface ChatRecipientInfoProps {
	recipient: ChatRecipient;
	className?: string;
}
const ChatRecipientInfo: React.FC<ChatRecipientInfoProps> = ({
	recipient,
	className,
}) => (
	<Item className={cn("px-4 py-2", className)}>
		<ItemMedia variant={"image"}>
			<Avatar className="size-8">
				<AvatarImage src={recipient?.avatar} alt={recipient.name} />
				<AvatarFallback>
					<User />
				</AvatarFallback>
			</Avatar>
		</ItemMedia>

		<ItemContent>
			<ItemTitle>{recipient.name}</ItemTitle>
			<ItemDescription>{recipient.location}</ItemDescription>
		</ItemContent>
	</Item>
);

const ChatContent: React.FC<React.ComponentProps<typeof CardContent>> = ({
	className,
	...props
}) => (
	<CardContent
		{...props}
		className={cn(
			"flex flex-1 flex-col justify-between gap-6 rounded-2xl border p-2",
			className,
		)}
	/>
);

const ChatAlertCount = ({ className, ...props }: BadgeProps) => (
	<Badge
		role="status"
		variant="destructive"
		{...props}
		className={cn(
			"flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500 p-0 text-xs font-semibold text-white",
			className,
		)}
	/>
);

interface MessageDocumentAttachmentProps
	extends React.ComponentProps<typeof Item> {
	attachment: MessageAttachment;
}
const MessageDocumentAttachment = ({
	className,
	attachment,
	...props
}: MessageDocumentAttachmentProps) => {
	return (
		<Item
			{...props}
			className={cn(
				"h-14 w-[12.2rem] flex-nowrap items-center p-2",
				className,
			)}>
			<ItemMedia
				variant={"icon"}
				className="aspect-square min-h-full w-auto !translate-y-0 !self-auto rounded-lg bg-black">
				<File className="text-white" />
			</ItemMedia>

			<ItemContent className="max-w-[66%]">
				<ItemTitle className="max-w-full truncate">
					{attachment.name}
				</ItemTitle>

				<ItemDescription className="font-medium text-slate-500">
					{getMIMETypeLabel(attachment.mimeType)}
				</ItemDescription>
			</ItemContent>
		</Item>
	);
};

interface MessageImageAttachmentProps
	extends React.ComponentProps<typeof Item> {
	attachment: MessageAttachment;
}
const MessageImageAttachment = ({
	className,
	attachment,
	...props
}: MessageImageAttachmentProps) => {
	return (
		<Item
			{...props}
			className={cn(
				"aspect-square size-14 flex-nowrap items-center rounded-lg bg-slate-100 p-1",
				className,
			)}>
			<ItemMedia variant={"image"} className="size-full">
				<img
					className="size-full object-cover"
					src={attachment.url}
					alt={attachment.name}
				/>
			</ItemMedia>
		</Item>
	);
};

export {
	Chat,
	ChatAlertCount,
	ChatContent,
	ChatHeader,
	ChatRecipientInfo,
	ChatStatusBadge,
	MessageDocumentAttachment,
	MessageImageAttachment,
};

export type { MessageDocumentAttachmentProps, MessageImageAttachmentProps };
