/** @format */

import { cn } from "@/lib/utils";
import {
	MessageAttachmentControl,
	MessageAttachmentsPreview,
	MessageDocumentAttachmentPreview,
	MessageImageAttachmentPreview,
} from "@/routes/main/routes/messages/components/chat/message-composer.tsx";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useFileToAttachment } from "../../../../hooks/use-file-to-attachment";
import { MessageAttachment } from "../../../../types";
import { COMPOSER_SET_VALUE_CONFIG, MessageForm } from "../form-schema";

interface AttachmentItemControlProps {
	attachment: MessageAttachment;
	index: number;
	children: React.ReactNode;
	className?: string;
}
const AttachmentItemControl: React.FC<AttachmentItemControlProps> = ({
	attachment,
	className,
	children,
	index,
}) => {
	const { setValue, getValues, getFieldState } =
		useFormContext<MessageForm>();
	const { invalid } = getFieldState(`attachments.${index}`);

	const handleRemoveItem = () => {
		const currentItems = getValues("attachments") ?? [];
		const filteredItems = currentItems.toSpliced(index, 1);
		setValue("attachments", filteredItems, COMPOSER_SET_VALUE_CONFIG);
	};

	return (
		<MessageAttachmentControl
			attachment={attachment}
			isValid={!invalid}
			onRemove={handleRemoveItem}
			className={cn("", className)}>
			{children}
		</MessageAttachmentControl>
	);
};

export const AttachmentsPreview: React.FC<{
	className?: string;
}> = ({ className }) => {
	const form = useFormContext<MessageForm>();
	const { watch } = form;
	const attachments = watch("attachments");
	const { getAttachmentFrom } = useFileToAttachment();

	return (
		<MessageAttachmentsPreview className={cn("", className)}>
			{attachments?.map((file, index) => {
				const attachment = getAttachmentFrom(file);

				return (
					<AttachmentItemControl
						key={attachment.url}
						index={index}
						attachment={attachment}>
						{attachment.category === "DOCUMENT" ? (
							<MessageDocumentAttachmentPreview
								attachment={attachment}
							/>
						) : attachment.category === "IMAGE" ? (
							<MessageImageAttachmentPreview
								attachment={attachment}
							/>
						) : null}
					</AttachmentItemControl>
				);
			})}
		</MessageAttachmentsPreview>
	);
};
