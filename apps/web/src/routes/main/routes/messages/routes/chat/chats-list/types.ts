/** @format */

interface BaseChatItem {
	id: string;
	name: string;
	avatar?: string;
	message: string;
	timestamp: string;
	// isOnline?: boolean; TODO: future feature
}
type ChatItem = BaseChatItem &
	(
		| { status: "UNREAD"; unreadCount: number }
		| { status: "READ"; unreadCount?: 0 }
	);
type ChatItemStatus = ChatItem["status"];

export type { ChatItem, ChatItemStatus };
