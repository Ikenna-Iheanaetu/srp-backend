/** @format */

import Dexie, { Table } from "dexie";
import { MessageForm } from "../chat/chatbox/components/message-composer-section/form-schema";
import { RenderableMsgFromClient, SchemaKeys } from "../chat/types";
import { generateClientMessageId } from "../chat/utils";

type StoredMessage = Prettify<
	SafeOmit<RenderableMsgFromClient, keyof MessageForm> &
		MessageForm & {
			recipientId: string;
		}
>;

class NewChatUnsentMessageDB extends Dexie {
	messages!: Table<StoredMessage>;
	/**
	 * The ID of the currently logged-in user who owns this database instance.
	 * Not to be confused with recipientId (the person being messaged).
	 */
	readonly userId: string;

	constructor(userId: string) {
		super(`NewChatUnsentMessageDB_${userId}`);
		this.userId = userId;
		this.version(1).stores({
			messages:
				"id, recipientId, timestamp" satisfies SchemaKeys<StoredMessage>,
		});
	}

	/**
	 * Adds a new unsent/failed message AND ensures the recipient details are stored.
	 */
	async addMessage(
		message: MessageForm & Pick<StoredMessage, "status">,
		recipientId: string,
	): Promise<StoredMessage> {
		const now = new Date().toISOString();

		const msgId = generateClientMessageId();
		const storedMessage: StoredMessage = {
			...message,
			recipientId,
			timestamp: now,
			id: msgId,
			from: "ME",
			renderKey: msgId,
		};

		await this.messages.add(storedMessage);

		return storedMessage;
	}

	/**
	 * Retrieves all distinct recipient IDs that currently have unsent/failed messages.
	 */
	async getRecipientIds(): Promise<string[]> {
		// Fetch unique recipientIds directly from the messages table
		return (await this.messages
			.orderBy("recipientId")
			.uniqueKeys()) as string[];
	}

	/**
	 * Retrieves all pending messages for a specific recipient, ordered by timestamp.
	 */
	async getRecipientMessages(recipientId: string): Promise<StoredMessage[]> {
		return await this.messages
			.where("recipientId")
			.equals(recipientId)
			.sortBy("timestamp");
	}

	/**
	 * Deletes all messages associated with that recipient ID.
	 */
	async deleteRecipientMessages(recipientId: string): Promise<void> {
		await this.messages.where("recipientId").equals(recipientId).delete();
	}

	/**
	 * Updates the status of an existing message.
	 * This is typically used to change status from 'SENDING' to 'FAILED'.
	 */
	async updateMessageStatus(
		messageId: StoredMessage["id"],
		newStatus: StoredMessage["status"],
	): Promise<void> {
		const numOfUpdated = await this.messages.update(messageId, {
			status: newStatus,
		});

		if (numOfUpdated === 0) {
			throw new Error(
				`Attempted to update status for non-existent message ID: ${messageId}`,
			);
		}
	}
}

let instance: NewChatUnsentMessageDB | null = null;

/**
 * Factory function for user-scoped database.
 * Pass userId to initialize/switch users, or omit to get existing instance.
 */
export function getDb(userId?: string): NewChatUnsentMessageDB {
	if (userId && (!instance || instance.userId !== userId)) {
		instance = new NewChatUnsentMessageDB(userId);
	}

	if (!instance) {
		throw new Error(
			"Database not initialized. Call getDb(userId) first with a user ID.",
		);
	}

	return instance;
}
