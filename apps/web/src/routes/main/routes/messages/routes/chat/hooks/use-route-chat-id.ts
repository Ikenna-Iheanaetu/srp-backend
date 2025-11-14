/** @format */

import { useParams } from "react-router";

export const useRouteChatId = () => {
	const { id: chatId } = useParams();
	if (!chatId) {
		throw new Error(
			"[useConversationsQueryConfig]: 'id' route param is invalid. Be sure this hook is used in the correct route.",
			{
				cause: chatId,
			},
		);
	}

	return chatId;
};
