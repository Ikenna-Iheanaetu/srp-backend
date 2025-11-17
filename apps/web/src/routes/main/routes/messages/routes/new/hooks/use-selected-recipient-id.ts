/** @format */

import { useQueryStates } from "nuqs";
import { newChatSearchParams } from "../search-params";

export const useSelectedRecipientId = () => {
	const [{ recipientId: selectedRecipientId }, setSelectedRecipientId] =
		useQueryStates(newChatSearchParams);

	return [selectedRecipientId, setSelectedRecipientId] as const;
};
