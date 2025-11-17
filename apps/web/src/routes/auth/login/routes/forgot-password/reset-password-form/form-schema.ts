/** @format */

import { addPasswordFieldsSchema } from "@/lib/schemas/password";
import { FormFieldBuilder } from "@/types/form";
import { z } from "zod";

export const ResetPasswordSchema = addPasswordFieldsSchema();
export type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>;

export const fieldBuilders = [
	{
		path: "password",
		type: "password",
		label: "New password",
		placeholder: "Enter new password",
	},
	{
		path: "confirmPassword",
		type: "password",
		label: "Confirm new password",
		placeholder: "Enter new password again",
	},
] as const satisfies FormFieldBuilder<ResetPasswordForm>[];
