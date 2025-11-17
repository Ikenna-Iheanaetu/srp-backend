/** @format */

import Dexie, { Table } from "dexie";
import { MessageForm } from "../chat/chatbox/components/message-composer-section/form-schema";
import { RenderableMsgFromClient, SchemaKeys } from "../chat/types";
import { generateClientMessageId } from "../chat/utils";

type StoredMessage = Prettify<
	SafeOmit<RenderableMsgFromClient, keyof MessageForm> &
		MessageForm & {
			chatId: string;
		}
>;

class ChatUnsentMessageDB extends Dexie {
	messages!: Table<StoredMessage>;
	/**
	 * The ID of the currently logged-in user who owns this database instance.
	 * Not to be confused with chatId (the conversation ID).
	 */
	readonly userId: string;

	constructor(userId: string) {
		super(`ChatUnsentMessageDB_${userId}`);
		this.userId = userId;
		this.version(1).stores({
			messages:
				"id, chatId, timestamp" satisfies SchemaKeys<StoredMessage>,
		});
	}

	/**
	 * Adds a new unsent/failed message.
	 */
	async addMessage(
		message: MessageForm & Pick<StoredMessage, "status">,
		chatId: string,
	): Promise<StoredMessage> {
		const now = new Date().toISOString();

		const msgId = generateClientMessageId();
		const storedMessage: StoredMessage = {
			...message,
			chatId,
			timestamp: now,
			id: msgId,
			from: "ME",
			renderKey: msgId,
		};

		await this.messages.add(storedMessage);

		return storedMessage;
	}

	/**
	 * Retrieves all distinct chat IDs that currently have unsent/failed messages.
	 */
	async getChatIds(): Promise<string[]> {
		// Fetch unique chatIds directly from the messages table
		return (await this.messages.orderBy("chatId").uniqueKeys()) as string[];
	}

	/**
	 * Retrieves all pending messages for a specific chat, ordered by timestamp (descending order - newest first).
	 */
	async getChatMessages(chatId: string): Promise<StoredMessage[]> {
		return (
			await this.messages
				.where("chatId")
				.equals(chatId)
				.sortBy("timestamp")
		).reverse();
	}

	/**
	 * Deletes all messages associated with that chat ID.
	 */
	async deleteChatMessages(chatId: string): Promise<void> {
		await this.messages.where("chatId").equals(chatId).delete();
	}

	/**
	 * Deletes a single pending message by its unique message ID.
	 */
	async deleteMessage(messageId: StoredMessage["id"]): Promise<void> {
		return await this.messages.delete(messageId);
	}

	/**
	 * Updates the status of an existing message and resolves with the number of updated records.
	 * This is typically used to change status from 'SENDING' to 'FAILED'.
	 */
	async updateMessageStatus(
		messageId: StoredMessage["id"],
		newStatus: StoredMessage["status"],
	): Promise<number> {
		return await this.messages.update(messageId, {
			status: newStatus,
		});
	}

	/**
	 * Retrieves a single message by its unique message ID.
	 */
	async getMessage(
		messageId: StoredMessage["id"],
	): Promise<StoredMessage | undefined> {
		return await this.messages.get(messageId);
	}
}

let instance: ChatUnsentMessageDB | null = null;

/**
 * Factory function for user-scoped database.
 * Pass userId to initialize/switch users, or omit to get existing instance.
 */
export function getDb(userId?: string): ChatUnsentMessageDB {
	if (userId && (!instance || instance.userId !== userId)) {
		instance = new ChatUnsentMessageDB(userId);
	}

	if (!instance) {
		throw new Error(
			"Database not initialized. Call getDb(userId) first with a user ID.",
		);
	}

	return instance;
}

export type { StoredMessage };
