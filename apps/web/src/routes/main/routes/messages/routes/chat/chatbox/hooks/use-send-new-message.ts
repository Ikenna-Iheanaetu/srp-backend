/** @format */

import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { calculateNewMeta } from "@/lib/helper-functions/pagination";
import {
	chatSocket,
	EventEmitResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "@/routes/main/routes/messages/constants";
import { useMutation } from "@tanstack/react-query";
import { useChatRoom } from "../../chat-room-context";
import { StoredMessage } from "../../db";
import { chatQueries } from "../../query-factory";
import { ApiChatMessage, RenderableMsgFromApi } from "../../types";
import { processAttachmentsToSend } from "../../utils";
import { getErrorMessage } from "@/lib/utils";

export const useSendNewMessage = () => {
	const { roomId } = useChatRoom();
	return useMutation({
		mutationFn: async (message: StoredMessage) => {
			if (!roomId) {
				throw new Error("Chat room not ready");
			}
			const processedAttachments = await processAttachmentsToSend(
				message.attachments ?? [],
			);
			const response = (await chatSocket
				.timeout(EVENT_EMIT_TIMEOUT)
				.emitWithAck("message:send", {
					chatId: roomId,
					message: {
						content: message.content,
						...(processedAttachments.length
							? { attachments: processedAttachments }
							: {}),
					},
				})) as EventEmitResponse<"message:send">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
			return response.data;
		},
		onMutate: () => {
			if (!roomId) {
				throw new Error("Chat room not ready");
			}
			// Capture queryKey for consistency throughout the operation
			const capturedQueryKey = chatQueries.infiniteMessages({
				chatId: roomId,
			}).queryKey;

			return { capturedQueryKey };
		},
		onSuccess: (
			{ message: newApiMsg },
			storedMsg,
			{ capturedQueryKey },
			{ client },
		) => {
			// Add new message in order of timestamp
			client.setQueryData(capturedQueryKey, (old) => {
				const oldData: NonNullable<typeof old> = old ?? {
					pages: [],
					pageParams: [],
				};

				const msgToInsert: RenderableMsgFromApi = {
					...newApiMsg,
					renderKey: storedMsg.renderKey,
				};
				let hasInsertedNewMsg = false;
				// Ensure data immutability
				const newPages = oldData.pages.map((page) => {
					if (hasInsertedNewMsg) {
						return page;
					}

					const mergedData: ApiChatMessage[] = [];
					const pageData = page.data;

					for (let i = 0; i < pageData.length; i++) {
						const apiMsg = pageData[i];
						if (!apiMsg) continue;
						// if timestamp of new message is newer than current message, add new message first
						if (msgToInsert.timestamp >= apiMsg.timestamp) {
							mergedData.push(msgToInsert);
							hasInsertedNewMsg = true;

							// Push the rest of the messages in this page and break
							const remainingMsgs = pageData.slice(i);
							mergedData.push(...remainingMsgs);
							break;
						}
						// If we didn't insert the new message, just push the current one and continue.
						mergedData.push(apiMsg);
						continue;
					}

					// If new message wasn't inserted in this page, return original page
					if (!hasInsertedNewMsg) {
						return page;
					}

					return {
						...page,
						data: mergedData,
						meta: calculateNewMeta(mergedData.length, page.meta),
					};
				});

				// If the new message hasn't been inserted yet, prepend it to the first page
				if (!hasInsertedNewMsg) {
					// Ensure data immutability
					const firstPageIndex = 0;
					const firstPage = newPages[firstPageIndex];
					let newFirstPage: NonNullable<typeof firstPage>;
					if (firstPage?.data.length) {
						const newFirstPageData = [
							msgToInsert,
							...firstPage.data,
						];
						hasInsertedNewMsg = true;
						newFirstPage = {
							...firstPage,
							data: newFirstPageData,
							meta: calculateNewMeta(
								newFirstPageData.length,
								firstPage.meta,
							),
						};
					} else {
						// The first page has no data, so it MUST be a new page
						hasInsertedNewMsg = true;
						newFirstPage = {
							...firstPage,
							data: [msgToInsert],
							meta: firstPage?.meta ?? {
								total: 1,
								totalPages: 1,
								limit: DEFAULT_PAGE_SIZE,
								page: 1,
							},
						};
					}
					// newPages is already a new array from map, so we can mutate it directly
					newPages[firstPageIndex] = newFirstPage;
				}

				return {
					...oldData,
					pages: newPages,
				};
			});
		},

		onError: (e) => {
			console.error("error sending msg", e);
			console.error("Error ", getErrorMessage(e));
		},

		meta: {
			errorMessage: "none", // caller should handle toasting errors with MutateOptions.onError
		},
	});
};
