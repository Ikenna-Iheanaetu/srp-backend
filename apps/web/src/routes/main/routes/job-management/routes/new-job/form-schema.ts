/** @format */

import { TREE_PATH_SEPERATOR } from "@/constants/tree-ui";
import { TreePath } from "@/lib/helper-functions/generic-string-helpers";
import { dateStringSchema } from "@/lib/schemas";
import { EmploymentTypeEnumsSchema } from "@/lib/schemas/work-experience";
import { z } from "zod";

const SalaryRangeSchema = z
	.object({
		min: z.coerce
			.number()
			.min(1, { message: "Minimum salary must be greater than zero" }),
		max: z.coerce
			.number()
			.min(1, { message: "Maximum salary must be greater than zero" }),
		currency: z.string().min(1, {
			message: "Currency is required",
		}),
	})
	// .refine doesn't work, so superRefine is used instead.
	.superRefine((data, ctx) => {
		if (data.min > data.max) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Minimum salary must not exceed maximum salary",
				path: ["min"],
			});
		}
	});

export type SalaryRange = z.infer<typeof SalaryRangeSchema>;

export const NewJobFormSchema = z.object({
	title: z.string().min(1, "Job title is required"),
	type: EmploymentTypeEnumsSchema,
	description: z.string().min(1, "Job description is required"),
	responsibilities: z
		.array(z.string())
		.min(1, "At least one responsibility is required"),
	qualifications: z
		.array(z.string())
		.min(1, "At least one qualification is required"),
	skills: z.array(z.string()).min(1, "At least one skill is required"),
	traits: z.array(z.string()).min(1, "At least one trait is required"),
	startDate: dateStringSchema,
	endDate: dateStringSchema.optional(),
	salary: SalaryRangeSchema,
	openToAll: z.boolean().default(false),
	tags: z.array(z.string()).optional(),
	role: z
		.string()
		.min(1, "Role is required")
		.includes(TREE_PATH_SEPERATOR, {
			message: "Should be a role gotten from a tree dropdown",
		})
		.transform((path) => path as TreePath),
	location: z.string().min(1, "Location is required"),
});

export type NewJobFormData = z.infer<typeof NewJobFormSchema>;
export type NewJobFormDataInput = z.input<typeof NewJobFormSchema>;
