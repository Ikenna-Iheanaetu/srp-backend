/** @format */

import { createSerializer, parseAsString } from "nuqs";

export const newChatSearchParams = {
	recipientId: parseAsString.withOptions({
		history: "push", // allow for back navigation, especially on mobile
	}),
};

export const serializeNewChatSearchParams =
	createSerializer(newChatSearchParams);
