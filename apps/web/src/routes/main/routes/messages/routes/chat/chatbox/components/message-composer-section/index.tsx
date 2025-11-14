/** @format */

import { getDirtyValues } from "@/lib/helper-functions/forms";
import {
	MessageComposer,
	MessageInputArea,
	MessageInputFooter,
	MessageSendArea,
	MessageSendButton,
	MessageValidationError,
} from "@/routes/main/routes/messages/components/chat/message-composer";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FieldError, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { getDb } from "../../../db";
import { useChatDetails } from "../../../hooks/use-chat-details";
import { useSendNewMessage } from "../../hooks/use-send-new-message";
import { AttachmentsPicker } from "./components/attachments-picker";
import { AttachmentsPreview } from "./components/attachments-preview";
import { TextBox } from "./components/text-box";
import { MessageForm, MessageFormSchema } from "./form-schema";

export const MessageComposerSection: React.FC<{ className?: string }> = ({
	className,
}) => {
	const form = useForm({
		resolver: zodResolver(
			MessageFormSchema /* This type error is caused by https://github.com/react-hook-form/resolvers/issues/793#issuecomment-3476687316 */,
		),
		defaultValues: {
			content: "",
			attachments: [],
		},
		mode: "onChange", // this is extremely important
	});
	const { reset, handleSubmit, formState } = form;
	const { dirtyFields } = formState;

	const { mutate: sendNewMessage } = useSendNewMessage();

	const { data: chatDetails } = useChatDetails();

	const onSubmit = async (formData: MessageForm) => {
		if (!chatDetails) {
			toast.error("Chat data not ready");
			return;
		}

		reset();

		const updatedValues = getDirtyValues(dirtyFields, formData);
		if (Object.keys(updatedValues).length === 0) {
			return;
		}

		const db = getDb();
		const storedMsg = await db.addMessage(
			{
				...formData,
				status: "SENDING",
			},
			chatDetails.id,
		);

		sendNewMessage(
			storedMsg,

			{
				onSuccess: () => {
					void getDb().deleteMessage(storedMsg.id);
				},
				onError: () => {
					void getDb().updateMessageStatus(storedMsg.id, "FAILED");
				},
			},
		);
	};

	const { isValid, isDirty, errors } = formState;
	const canSendMessage =
		isValid && isDirty && chatDetails?.status === "ACCEPTED";

	// Don't wrap in useMemo, formState.errors doesn't follow Rules of React
	const errorsArray = Object.values(errors).flatMap((error) => {
		if (Array.isArray(error)) {
			return (error as FieldError[]).map(
				(e) => e.message ?? "Unknown error",
			);
		}
		return error.message ?? "Unknown error";
	});

	return (
		<FormProvider {...form}>
			<MessageComposer
				onSubmit={(e) => {
					if (!canSendMessage) {
						return;
					}
					void handleSubmit(onSubmit)(e);
				}}
				className={className}>
				<MessageInputArea>
					<AttachmentsPreview />
					<TextBox />

					<MessageInputFooter>
						<AttachmentsPicker />

						<MessageSendArea>
							{errorsArray.length > 0 && (
								<MessageValidationError>
									{errorsArray[0]}
								</MessageValidationError>
							)}

							<MessageSendButton disabled={!canSendMessage} />
						</MessageSendArea>
					</MessageInputFooter>
				</MessageInputArea>
			</MessageComposer>
		</FormProvider>
	);
};
