/** @format */

import { parseAsString, parseAsStringEnum, Values } from "nuqs";
import { ChatItemStatus } from "./types";

const chatsListSearchParams = {
	search: parseAsString.withDefault(""),
	status: parseAsStringEnum<ChatItemStatus>(["READ", "UNREAD"]),
};

type ChatsListSearchParams = Prettify<
	NonNullableValues<Values<typeof chatsListSearchParams>>
>;

type StatusTab = ChatItemStatus | "ALL";

const STATUS_TABS = {
	ALL: "ALL",
	UNREAD: "UNREAD",
	READ: "READ",
} as const satisfies Record<string, StatusTab>;

export { STATUS_TABS, chatsListSearchParams };
export type { ChatItemStatus, ChatsListSearchParams, StatusTab };
