/** @format */

import { z } from "zod";

// Define predefined questions
export const DEFAULT_SECURITY_QUESTIONS = [
	"What is your mother's maiden name?",
	"What was the name of your first pet?",
	"What was the name of your high school?",
] as const;

// Define the security question schema
export const SecurityQuestionSchema = z.object({
	question: z
		.union([
			z.enum(DEFAULT_SECURITY_QUESTIONS), // Predefined questions
			z
				.string()
				.min(1, "Custom question is required")
				.max(100, "Question must not exceed 100 characters"),
		])
		.transform((val) => val.toLowerCase().trim()),
	answer: z
		.string()
		.max(50, "Answer must not exceed 50 characters")
		.transform((val) => val.toLowerCase().trim()),
});
