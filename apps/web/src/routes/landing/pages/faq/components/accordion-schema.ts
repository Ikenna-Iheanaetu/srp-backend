/** @format */

import { z } from "zod";

// Define the schema for a single accordion item
const AccordionItemSchema = z.object({
	question: z.string(), // The question displayed in the accordion
	answer: z.string(), // The corresponding answer text
});

// Define the schema for the entire accordion (an array of items)
export const AccordionSchema = z.array(AccordionItemSchema);

export type AccordionList = z.infer<typeof AccordionSchema>;

// Example Data
export const accordionData: AccordionList = [
	{
		question: "Is there a free trial available?",
		answer: "Yes, you can try us for free for 30 days. If you want, we'll provide you with a free, personalized 30-minute onboarding call to get you up and running as soon as possible.",
	},
	{
		question: "Are there any additional fees?",
		answer: "No, there are no hidden or additional fees beyond your subscription cost.",
	},
	{
		question: "What payment methods are accepted?",
		answer: "We accept all major credit cards and PayPal.",
	},
	{
		question: "Can I upgrade or downgrade my plan?",
		answer: "Yes, you can upgrade or downgrade your plan at any time through your account settings.",
	},
	{
		question: "How does billing work?",
		answer: "Billing is done on a monthly basis. You will be charged on the same day each month based on your subscription start date.",
	},
	{
		question: "How do I change my account email?",
		answer: "You can change your account email by navigating to your account settings and updating your email address.",
	},
];
