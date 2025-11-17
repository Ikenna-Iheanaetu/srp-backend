/** @format */

import { AllowedSignupUserTypeSchema } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { parseAsString, parseAsStringEnum, useQueryStates, Values } from "nuqs";

const declineSearchParams = {
	email: parseAsString,
	refCode: parseAsString,
	role: parseAsStringEnum(AllowedSignupUserTypeSchema.options),
	otp: parseAsString,
};

export type DeclineInviteParams = NonNullableValues<
	Values<typeof declineSearchParams>
>;

export const useDeclineSearchParams = () => {
	return useQueryStates(declineSearchParams);
};
