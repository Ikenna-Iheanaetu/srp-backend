/** @format */

import { createSerializer, parseAsString } from "nuqs";
import { z } from "zod";

export const OTP_LENGTH = 6;

export const OTPFormSchema = z.object({
	otp: z.string().min(OTP_LENGTH, {
		message: `OTP should be ${OTP_LENGTH} digits long`,
	}),
});

export type OTPForm = z.infer<typeof OTPFormSchema>;

export const VerifyEmailSearchParams = {
	email: parseAsString,
};

export const serializeVerifyEmailParams = createSerializer(VerifyEmailSearchParams);
