/** @format */

import { z } from "zod";

export const PasswordChangeSchema = z
	.object({
		oldPassword: z.string().min(8, "Old password required"),

		newPassword: z
			.string()
			.min(8, "Too short")
			.max(32, "Too long")
			.regex(/[A-Z]/, "Must have uppercase")
			.regex(/[a-z]/, "Must have lowercase")
			.regex(/\d/, "Must have number")
			.regex(/[@$!%*?&]/, "Must have special character"),

		confirmNewPassword: z.string(),

		securityQuestion: z.object({
			question: z.string().optional(), // Optional initially; validated in superRefine
			answer: z.string().optional(), // Optional initially; validated in superRefine
		}),
	})
	.superRefine((data, ctx) => {
		// Validate password confirmation
		if (data.newPassword !== data.confirmNewPassword) {
			ctx.addIssue({
				path: ["confirmNewPassword"],
				message: "Passwords do not match",
				code: z.ZodIssueCode.custom,
			});
		}

		// Validate security question and answer together
		const { question, answer } = data.securityQuestion;

		if (!question && !answer) {
			ctx.addIssue({
				path: ["securityQuestion", "answer"], // Attach error to 'answer'
				message: "Security question and answer required.",
				code: z.ZodIssueCode.custom,
			});
		} else if (!question) {
			ctx.addIssue({
				path: ["securityQuestion", "answer"], // Attach error to 'answer'
				message: "Select a valid security question.",
				code: z.ZodIssueCode.custom,
			});
		} else if (!answer) {
			ctx.addIssue({
				path: ["securityQuestion", "answer"], // Attach error to 'answer'
				message: "Answer required.",
				code: z.ZodIssueCode.custom,
			});
		}
	});

export type PasswordChangeForm = z.infer<typeof PasswordChangeSchema>;
