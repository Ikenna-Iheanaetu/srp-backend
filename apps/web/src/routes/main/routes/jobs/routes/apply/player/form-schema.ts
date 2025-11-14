/** @format */

import { ResumeSchema } from "@/lib/schemas/file";
import { YearsOfExperienceSchema } from "@/lib/schemas/user";
import { z } from "zod";

// Define allowed document MIME types
const allowedDocumentTypes = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Define size limit (5MB in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Centralized file validation schema
const documentFileSchema = z.union([
	z.string(),
	z
		.instanceof(File, { message: "Must be a file" })
		.refine((file) => file && allowedDocumentTypes.includes(file.type), {
			message: "Must be a PDF, DOC, or DOCX",
		})
		.refine((file) => file && file.size <= MAX_FILE_SIZE, {
			message: "File size must be under 5MB",
		}),
]);

// Define the schema for the form
export const jobApplicationFormSchema = z.object({
	name: z.string().min(1, { message: "Required" }),
	email: z
		.string()
		.min(1, { message: "Required" })
		.email({ message: "Invalid email" }),
	zip: z
		.string()
		.min(1, { message: "Required" })
		.regex(/^\d{5}$/, { message: "Zip code must be 5 digits" }),
	phone: z
		.string()
		.min(1, { message: "Required" })
		.regex(/^\+?[\d\s-]{10,}$/, { message: "Invalid phone number" }),
	resume: ResumeSchema,
	applicationLetter: documentFileSchema.optional(),
	legallyAuthorized: z.boolean({ required_error: "Required" }).default(false),
	visaSponsorship: z.boolean({ required_error: "Required" }).default(false),
	yearsOfExperience: YearsOfExperienceSchema,
	isInfoAccurate: z.boolean({ required_error: "Required" }),
});

export type JobApplicationForm = z.infer<typeof jobApplicationFormSchema>;
