/** @format */

import { z } from "zod";

export const contactUsSchema = z.object({
	firstName: z
		.string()
		.min(2, { message: "First name must be at least 2 characters long." })
		.max(100, { message: "First name cannot exceed 100 characters." }),
	lastName: z
		.string()
		.min(2, { message: "Last name must be at least 2 characters long." })
		.max(100, { message: "Last name cannot exceed 100 characters." }),
	email: z.string().email({ message: "Please enter a valid email address." }),
	phoneNumber: z.string().regex(
		/^\+?[1-9]\d{1,14}$/, // E.164 international format (e.g., +1234567890)
		{
			message:
				"Phone number must be in international format (e.g., +1234567890).",
		}
	),
	message: z
		.string()
		.min(10, { message: "Message must be at least 10 characters long." })
		.max(500, { message: "Message cannot exceed 500 characters." }),
	acceptPrivacyPolicy: z.boolean().refine((val) => val === true, {
		message: "You have to accept the privacy policy.",
	}),
});

export type ContactUsFormData = z.infer<typeof contactUsSchema>;
