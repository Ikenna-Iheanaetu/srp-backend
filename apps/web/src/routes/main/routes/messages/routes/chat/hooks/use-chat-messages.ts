/** @format */

import { useInfiniteQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import { getDb } from "../db";
import { RenderableChatMessage, RenderableMsgFromApi } from "../types";
import { useChatMessagesQueryConfig } from "./use-chat-messages-query-config";
import { useFileToAttachment } from "./use-file-to-attachment";

export const useChatMessages = () => {
	const { queryOptions, chatId } = useChatMessagesQueryConfig();
	const { data: apiPaginatedMessages } = useInfiniteQuery(queryOptions);

	const { getAttachmentFrom, revokeAttachmentUrls } = useFileToAttachment();
	const localMessages: RenderableChatMessage[] | undefined =
		useLiveQuery(async () => {
			revokeAttachmentUrls(); // Clean up prev URLs on every new execution.

			const db = getDb();
			const dbMessages = await db.getChatMessages(chatId);
			return dbMessages.map(
				(msg) =>
					({
						...msg,
						attachments: msg.attachments?.map((file) =>
							getAttachmentFrom(file),
						),
					}) as RenderableChatMessage,
			);
		}, [chatId]);

	const messages: RenderableChatMessage[] = React.useMemo(() => {
		if (!apiPaginatedMessages || !localMessages) {
			return [];
		}

		// NOTE: This merge logic assumes that both api and local messages are sorted newest-first (descending order)

		const merged: RenderableChatMessage[] = [];
		const localRenderKeys = new Map<string, number>();
		// set render keys and return new array reference
		const remainingLocalMessages = localMessages.map((msg, index) => {
			localRenderKeys.set(msg.renderKey, index);
			return msg;
		});

		// We do not use flatMap because this can be done in a single pass
		// to properly merge based on timestamps.
		apiPaginatedMessages.pages.forEach((page) => {
			page.data.forEach((apiMsg) => {
				const renderableApiMsg: RenderableMsgFromApi =
					"renderKey" in apiMsg
						? apiMsg
						: {
								...apiMsg,
								renderKey: apiMsg.id, // Use the server ID as the stable render key
							};

				if (localRenderKeys.has(renderableApiMsg.renderKey)) {
					const keyToRemove = renderableApiMsg.renderKey;
					const index = remainingLocalMessages.findIndex(
						(msg) => msg.renderKey === keyToRemove,
					);
					if (index > -1) {
						remainingLocalMessages.splice(index, 1);
						localRenderKeys.delete(keyToRemove);
					}
				}

				// if timestamp of local message is newer than api message, add local messages first
				const canAddLocalsFirst = (): boolean => {
					const firstLocalMsg = remainingLocalMessages[0];
					return !!(
						firstLocalMsg &&
						firstLocalMsg.timestamp >= renderableApiMsg.timestamp
					);
				};
				while (canAddLocalsFirst()) {
					const firstMsg = remainingLocalMessages.shift(); // remove and return the first message
					if (firstMsg) {
						merged.push(firstMsg);
					}
				}

				merged.push(renderableApiMsg);
			});
		});

		// Append any remaining local messages
		if (remainingLocalMessages.length > 0) {
			return merged.concat(remainingLocalMessages);
		}

		return merged;
	}, [apiPaginatedMessages, localMessages]);

	return {
		messages,
	};
};
