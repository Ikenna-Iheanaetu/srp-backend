/** @format */

import { emailSchema } from "@/lib/schemas";
import { FormFieldBuilder } from "@/types/form";
import { z } from "zod";

export const OTP_LENGTH = 6;

export const fieldBuilders = [
	{
		path: "email",
		type: "email",
		label: "Email",
		placeholder: "Enter account email",
	},
	{
		path: "otp",
		type: "number",
		label: "Enter sent OTP",
		placeholder: "e.g 123456",
	},
] as const satisfies FormFieldBuilder<OTPForm>[];

export const OTPFormSchema = z.object({
	email: emailSchema,
	otp: z.string().min(OTP_LENGTH, {
		message: `OTP should be ${OTP_LENGTH} digits long`,
	}),
});

export type OTPForm = z.infer<typeof OTPFormSchema>;
