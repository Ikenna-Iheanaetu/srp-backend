/** @format */

import { useQuery } from "@tanstack/react-query";
import { chatQueries } from "../query-factory";
import { useRouteChatId } from "./use-route-chat-id";

export const useChatDetails = () => {
	const chatId = useRouteChatId();

	return useQuery(chatQueries.chatDetails(chatId));
};
