/** @format */

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveQuery } from "dexie-react-hooks";
import { FolderOpen } from "lucide-react";
import React from "react";
import { FieldError, useForm } from "react-hook-form";
import {
	MessageAttachmentControl,
	MessageAttachmentsPicker,
	MessageAttachmentsPickerMenu,
	MessageAttachmentsPreview,
	MessageComposer,
	MessageDocumentAttachmentPreview,
	MessageImageAttachmentPreview,
	MessageInputArea,
	MessageInputFooter,
	MessageQuickReplies,
	MessageQuickReply,
	MessageSendArea,
	MessageSendButton,
	MessageTextBox,
	MessageValidationError,
} from "../../../../components/chat/message-composer";
import {
	COMPOSER_SET_VALUE_CONFIG,
	MAX_FILE_ATTACHMENTS,
	MessageForm,
	MessageFormSchema,
} from "../../../chat/chatbox/components/message-composer-section/form-schema";
import { useFileToAttachment } from "../../../chat/hooks/use-file-to-attachment";
import { ChatRecipient, ClientChatMessage } from "../../../chat/types";
import { getDb } from "../../db";
import { QUICK_REPLIES } from "./constants";
import { useInitiateChat } from "./use-initiate-chat";

interface ComposerSectionProps {
	recipient: ChatRecipient;
	className?: string;
}

export const ComposerSection: React.FC<ComposerSectionProps> = ({
	recipient,
	className,
}) => {
	const {
		register,
		formState,
		handleSubmit,
		reset,
		setValue,
		watch,
		getFieldState,
	} = useForm({
		resolver: zodResolver(
			MessageFormSchema /* This type error is caused by https://github.com/react-hook-form/resolvers/issues/793#issuecomment-3476687316 */,
		),
		defaultValues: {
			content: "",
			attachments: [],
		},
		mode: "onChange", // this on change is extremely important
	});

	React.useEffect(() => {
		register("attachments");
	}, [register]);
	const selectedAttachments = watch("attachments") ?? [];
	const canSelectAttachments =
		selectedAttachments.length < MAX_FILE_ATTACHMENTS;

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
			} as ClientChatMessage;
		}
	}, [recipient.id]);

	const { isValid, isDirty, errors } = formState;
	const canSendMessage = isValid && isDirty && !newMessage;

	// Don't wrap in useMemo, formState.errors doesn't follow Rules of React
	const errorsArray = Object.values(errors).flatMap((error) => {
		if (Array.isArray(error)) {
			return (error as FieldError[]).map(
				(e) => e.message ?? "Unknown error",
			);
		}
		return error.message ?? "Unknown error";
	});

	const { mutate: initiateChat } = useInitiateChat();
	const onSubmit = async (formData: MessageForm) => {
		reset();

		const db = getDb();
		const storedMessage = await db.addMessage(
			{ ...formData, status: "SENDING" },
			recipient.id,
		);

		initiateChat(
			{ recipient, message: formData },
			{
				onSuccess: () => {
					void db.deleteRecipientMessages(storedMessage.recipientId);
				},
				onError: () => {
					void db.updateMessageStatus(storedMessage.id, "FAILED");
				},
			},
		);
	};

	const handleQuickReply = (reply: string) => {
		setValue("content", reply, COMPOSER_SET_VALUE_CONFIG);
	};

	return (
		<MessageComposer
			onSubmit={(e) => void handleSubmit(onSubmit)(e)}
			className={cn(className)}>
			<MessageQuickReplies>
				{!newMessage &&
					QUICK_REPLIES.map((reply) => (
						<MessageQuickReply
							onClick={() => handleQuickReply(reply)}
							key={reply}
							reply={reply}
						/>
					))}
			</MessageQuickReplies>

			<MessageInputArea>
				<MessageAttachmentsPreview>
					{selectedAttachments.map((file, index) => {
						const attachment = getAttachmentFrom(file);
						const { invalid } = getFieldState(
							`attachments.${index}`,
						);
						return (
							<MessageAttachmentControl
								key={attachment.url}
								attachment={attachment}
								isValid={!invalid}
								onRemove={() => {
									const filteredItems =
										selectedAttachments.toSpliced(index, 1);
									setValue(
										"attachments",
										filteredItems,
										COMPOSER_SET_VALUE_CONFIG,
									);
								}}>
								{attachment.category === "DOCUMENT" ? (
									<MessageDocumentAttachmentPreview
										attachment={attachment}
									/>
								) : attachment.category === "IMAGE" ? (
									<MessageImageAttachmentPreview
										attachment={attachment}
									/>
								) : null}
							</MessageAttachmentControl>
						);
					})}
				</MessageAttachmentsPreview>

				<MessageTextBox {...register("content")} />

				<MessageInputFooter>
					<MessageAttachmentsPickerMenu
						disabled={!canSelectAttachments}>
						<DropdownMenuItem>Contact card</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<MessageAttachmentsPicker
								onChange={(e) => {
									const newFiles = e.target.files ?? [];
									if (newFiles.length > 0) {
										setValue(
											"attachments",
											[
												...selectedAttachments,
												...newFiles,
											],
											COMPOSER_SET_VALUE_CONFIG,
										);
									}
								}}>
								Files / Images{" "}
								<FolderOpen className="ml-auto" />
							</MessageAttachmentsPicker>
						</DropdownMenuItem>
					</MessageAttachmentsPickerMenu>

					<MessageSendArea>
						{errorsArray.length > 0 && (
							<MessageValidationError>
								{
									// 1 error at a time
									errorsArray[0]
								}
							</MessageValidationError>
						)}

						<MessageSendButton disabled={!canSendMessage} />
					</MessageSendArea>
				</MessageInputFooter>
			</MessageInputArea>
		</MessageComposer>
	);
};
