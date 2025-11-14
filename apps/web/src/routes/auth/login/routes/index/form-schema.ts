/** @format */

import { emailSchema } from "@/lib/schemas/index";
import { FormFieldBuilder } from "@/types/form";
import { z } from "zod";

export const AuthLoginSchema = z.object({
	email: emailSchema,
	password: z.string().min(2, "Enter valid password"),
});

export type AuthLoginForm = z.infer<typeof AuthLoginSchema>;

export const fieldBuilders = [
	{
		path: "email",
		label: "Email address",
		type: "email",
		placeholder: "Enter your email address",
	},
	{
		path: "password",
		label: "Password",
		type: "password",
		placeholder: "Enter your password",
	},
] as const satisfies FormFieldBuilder<AuthLoginForm>[];
