/** @format */

import { PostChatInquirySearchParams } from "@repo/shared";
import { parseAsBoolean, parseAsString, Values } from "nuqs";

const inquirySearchParams = {
	hired: parseAsBoolean,
	userEmail: parseAsString,
	companyEmail: parseAsString,
	chatId: parseAsString,
	companyName: parseAsString,
	token: parseAsString,
} satisfies HasKeysOf<PostChatInquirySearchParams>;

type InquirySearchParams = NonNullableValues<
	Values<typeof inquirySearchParams>
>;

export { inquirySearchParams };
export type { InquirySearchParams };
