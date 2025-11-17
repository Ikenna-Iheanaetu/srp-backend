/** @format */

import {
	AllowedSignupUserTypeSchema,
	RefCodeSchema,
} from "@/routes/auth/signup/routes/signup-form/form-schema";
import { z } from "zod";
import { DeclineInviteParams } from "./hooks/use-decline-search-params";

export const isValidDeclineParams = (
	params: unknown
): params is DeclineInviteParams => {
	if (!params || typeof params !== "object") {
		return false;
	}

	const { email, refCode, role, otp } =
		params as HasKeysOf<DeclineInviteParams>;
	const isEmailValid = z.string().email().safeParse(email).success;
	const isRefCodeValid = RefCodeSchema.safeParse(refCode).success;
	const isRoleValid = AllowedSignupUserTypeSchema.safeParse(role).success;
	const isOTPValid = !!otp; // backend will validate the otp number.

	return isEmailValid && isRefCodeValid && isRoleValid && isOTPValid;
};
