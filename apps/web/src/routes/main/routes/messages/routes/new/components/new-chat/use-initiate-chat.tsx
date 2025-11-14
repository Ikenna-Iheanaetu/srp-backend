/** @format */

import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { useMutation } from "@tanstack/react-query";
import { href, useNavigate } from "react-router";
import { chatSocket, EventEmitResponse } from "../../../../chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "../../../../constants";
import { MessageForm } from "../../../chat/chatbox/components/message-composer-section/form-schema";
import { chatQueries } from "../../../chat/query-factory";
import { ChatRecipient } from "../../../chat/types";
import { processAttachmentsToSend } from "../../../chat/utils";
import { useRecipientsQuery } from "../../hooks/use-recipients-query";

export const useInitiateChat = () => {
	const navigate = useNavigate();
	const { queryOptions: recipientsQueryOptions } = useRecipientsQuery();
	return useMutation({
		mutationFn: async ({
			recipient,
			message,
		}: {
			recipient: ChatRecipient;
			message: MessageForm;
		}) => {
			const processedAttachments = await processAttachmentsToSend(
				message.attachments ?? [],
			);

			const response = (await chatSocket
				.timeout(EVENT_EMIT_TIMEOUT)
				.emitWithAck("chat:request", {
					recipientId: recipient.id,
					content: message.content,
					...(processedAttachments.length
						? { attachments: processedAttachments }
						: {}),
				})) as EventEmitResponse<"chat:request">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
			return response.data;
		},
		onSuccess: (
			responseData,
			{ recipient },
			_onMutateResult,
			{ client },
		) => {
			const { chat, message: apiSavedMessage } = responseData;
			const chatId = chat.id;

			// Navigation can resume asynchronously without awaiting optimistic updates
			// NOTE: Don't await this promise, so that the optimistic updates run in parellel to the navigation
			void navigate(href("/messages/:id", { id: chatId }), {
				state: {
					crumbs: [
						{
							to: href("/messages"),
							label: "Messages",
						},
						{
							label: `Chat with ${chat.recipient.name}`,
						},
					],
				} satisfies CrumbsLocationState,
			});

			// Optimistically update the chat messages cache
			const { queryKey: createdChatMessagesQueryKey } =
				chatQueries.infiniteMessages({ chatId });
			client.setQueryData(createdChatMessagesQueryKey, () => {
				return {
					pages: [
						{
							data: [apiSavedMessage],

							// NOTE: No meta property here needs to be correct
							meta: {
								total: 1,
								totalPages: 1,
								page: 1,
								limit: 1,
							},
						},
					],
					pageParams: [1],
				};
			});

			// Optimistically add newly created chat to query cache
			const { queryKey: newChatQueryKey } =
				chatQueries.chatDetails(chatId);
			client.setQueryData(newChatQueryKey, () => {
				return chat;
			});

			// Optimistically remove the current recipient from new chat recipients query cache
			client.setQueryData(recipientsQueryOptions.queryKey, (old) => {
				if (!old) {
					return old;
				}

				const newPages = old.pages.map((page) => {
					const oldDataLength = page.data.length;

					const newData = page.data.filter(
						(r) => r.id !== recipient.id,
					);

					const wasRemoved = newData.length < oldDataLength;

					return {
						...page,
						data: newData,
						meta: wasRemoved
							? {
									...page.meta,
									total: page.meta.total - 1,
								}
							: page.meta,
					};
				});

				return {
					...old,
					pages: newPages,
				};
			});
		},
		meta: {
			errorMessage: "none", // Caller should handle error itself
		},
	});
};
