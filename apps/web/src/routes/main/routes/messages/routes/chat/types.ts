/** @format */

import { ClubProfileData } from "../../../profile/club/use-fetch-profile";
import { AllowedProfileUserType } from "../../../profile/schemas";
import { CLIENT_ONLY_MESSAGE_FLAG } from "./constants";

type AttachmentCategory = "DOCUMENT" | "IMAGE" | "AUDIO" | "VIDEO";
interface MessageAttachment {
	name: string;
	url: string;
	category: AttachmentCategory;
	mimeType: string;
	size: number;
}

type MessageStatus = "SENT" | "DELIVERED" | "READ";

interface BaseApiChatMessage {
	id: string;
	timestamp: string;
	status: MessageStatus;
}

interface TextMessageByMe extends BaseApiChatMessage {
	from: "ME";
	status: MessageStatus;
	content: string;
	attachments?: MessageAttachment[];
}

interface AttachmentMessageByMe extends BaseApiChatMessage {
	from: "ME";
	status: MessageStatus;
	content?: string;
	attachments: MessageAttachment[];
}

interface MixedMessageByMe extends BaseApiChatMessage {
	from: "ME";
	status: MessageStatus;
	content: string;
	attachments: MessageAttachment[];
}

type ApiChatMessageByMe =
	| TextMessageByMe
	| AttachmentMessageByMe
	| MixedMessageByMe;

interface BaseApiChatMessageByThem extends BaseApiChatMessage {
	status: SafeExclude<MessageStatus, "SENT">;
}

interface TextMessageByThem extends BaseApiChatMessageByThem {
	from: "THEM";
	content: string;
	attachments?: MessageAttachment[];
}

interface AttachmentMessageByThem extends BaseApiChatMessageByThem {
	from: "THEM";
	content?: string;
	attachments: MessageAttachment[];
}

interface MixedMessageByThem extends BaseApiChatMessageByThem {
	from: "THEM";
	content: string;
	attachments: MessageAttachment[];
}

type ApiChatMessageByThem =
	| TextMessageByThem
	| AttachmentMessageByThem
	| MixedMessageByThem;

type ApiChatMessage = ApiChatMessageByMe | ApiChatMessageByThem;

type ClientMessageStatus = "SENDING" | "FAILED";

type ClientChatMessage = Prettify<
	SafeOmit<ApiChatMessage, "status" | "id"> & {
		id: `${string}${typeof CLIENT_ONLY_MESSAGE_FLAG}`;
		status: ClientMessageStatus;
		from: "ME";
	}
>;

interface RenderableMessageProps {
	/** Stable, client-side ID for the React list 'key'. Prevents UI quirks when the client only message transitions to api saved message (id change)*/
	renderKey: string;
}

type RenderableMsgFromApi = ApiChatMessage & RenderableMessageProps;
type RenderableMsgFromClient = ClientChatMessage & RenderableMessageProps;
type RenderableChatMessage = RenderableMsgFromApi | RenderableMsgFromClient;

type ChatMessage = ApiChatMessage | ClientChatMessage | RenderableChatMessage;

type MessageSource = ChatMessage["from"];

interface ChatRecipient {
	id: string;
	profileId: string;
	name: string;
	userType: AllowedProfileUserType;
	avatar?: string;
	location?: string;
	club: Pick<ClubProfileData, "id" | "name" | "avatar">;
}

interface BaseChatDetails {
	id: string;
	recipient: ChatRecipient;
}

interface AcceptedChat extends BaseChatDetails {
	status: "ACCEPTED";
	initiatedBy: MessageSource;
	expiresAt: string;
	closedBy?: never;
	remainingExtensions: number;
}

interface PendingByMeChat extends BaseChatDetails {
	status: "PENDING";
	initiatedBy: "ME";
	expiresAt?: never;
	closedBy?: never;
}

interface PendingByThemChat extends BaseChatDetails {
	status: "PENDING";
	initiatedBy: "THEM";
	expiresAt?: never;
	closedBy?: never;
}

type PendingChat = PendingByMeChat | PendingByThemChat;

interface DeclinedByThemChat extends BaseChatDetails {
	status: "DECLINED";
	initiatedBy: "ME";
	expiresAt?: never;
	closedBy: "THEM";
	canRetryAt?: string;
}

interface DeclinedByMeChat extends BaseChatDetails {
	status: "DECLINED";
	initiatedBy: "THEM";
	expiresAt?: never;
	closedBy: "ME";
	canRetryAt?: string;
}

interface EndedByThemChat extends BaseChatDetails {
	status: "ENDED";
	initiatedBy: MessageSource;
	expiresAt?: never;
	closedBy: "THEM";
	canRetryAt?: string;
}

interface EndedByMeChat extends BaseChatDetails {
	status: "ENDED";
	initiatedBy: MessageSource;
	expiresAt?: never;
	closedBy: "ME";
	canRetryAt?: string;
}

type ExpiredChat = (BaseChatDetails & {
	status: "EXPIRED";
	initiatedBy: MessageSource;
	expiresAt?: never;
	closedBy: "EXPIRATION";
}) &
	(
		| { remainingExtensions: number; canRetryAt?: never }
		| { remainingExtensions: 0; canRetryAt?: string }
	);

type ChatDetails =
	| PendingChat
	| AcceptedChat
	| DeclinedByMeChat
	| DeclinedByThemChat
	| EndedByMeChat
	| EndedByThemChat
	| ExpiredChat;

type ChatStatus = ChatDetails["status"];

type KeysToString<T> =
	Exclude<keyof T, number | symbol> extends infer K
		? K extends string
			? K | `${K}, ${KeysToString<Omit<T, K>> & string}`
			: never
		: never;
/**
 * Ensures a string is a comma-separated list of keys from the type T.
 * Does not check for duplicates or order, just that all parts are valid keys.
 *
 * Intended for use in Dexie.js stores schema definitions.
 */
type SchemaKeys<T> = KeysToString<T> extends string ? KeysToString<T> : string;

export type {
	AcceptedChat,
	ApiChatMessage,
	ApiChatMessageByMe,
	ApiChatMessageByThem,
	AttachmentCategory,
	ChatDetails,
	ChatMessage,
	ChatRecipient,
	ChatStatus,
	ClientChatMessage,
	ClientMessageStatus,
	DeclinedByMeChat,
	DeclinedByThemChat,
	EndedByMeChat,
	EndedByThemChat,
	ExpiredChat,
	MessageAttachment,
	MessageSource,
	PendingByMeChat,
	PendingByThemChat,
	PendingChat,
	RenderableChatMessage,
	RenderableMsgFromApi,
	RenderableMsgFromClient,
	SchemaKeys,
};
