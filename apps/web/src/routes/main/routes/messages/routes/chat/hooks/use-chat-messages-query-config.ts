/** @format */

import React from "react";
import { chatQueries } from "../query-factory";
import { useRouteChatId } from "./use-route-chat-id";

export const useChatMessagesQueryConfig = () => {
	const chatId = useRouteChatId();

	const queryOptions = React.useMemo(
		() =>
			chatQueries.infiniteMessages({
				chatId,
			}),
		[chatId],
	);

	return {
		queryOptions,
		chatId,
	};
};
