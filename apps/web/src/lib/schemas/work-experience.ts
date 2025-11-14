/** @format */

import { EMPLOYMENT_TYPE_OPTIONS } from "@/constants/data";
import { z } from "zod";
import {
	dateStringSchema,
	emailSchema,
	numStringSchema,
	PhoneNumberSchema,
} from "./index";

export const EmploymentTypeEnumsSchema = z.enum(EMPLOYMENT_TYPE_OPTIONS);
export type EmploymentType = z.infer<typeof EmploymentTypeEnumsSchema>;

export const EmploymentTypesSchema = z.preprocess(
	(val) =>
		Array.isArray(val)
			? val.filter((item): item is EmploymentType =>
					EmploymentTypeEnumsSchema.options.some(
						(type) => type === item
					)
			  )
			: [],
	z
		.array(EmploymentTypeEnumsSchema.optional())
		.transform((array) => array.filter(Boolean))
);

export const EmploymentModeSchema = z.enum(["remote", "in_person", "hybrid"]);
export type EmploymentMode = z.infer<typeof EmploymentModeSchema>;

export const ExperienceLevelSchema = z.enum([
	"entry_level",
	"mid_level",
	"senior_level",
	"executive",
]);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const SingleWorkExperienceSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		company: z.string().min(1, "Company is required"),
		companyPhone: PhoneNumberSchema.empty().optional(),
		companyEmail: emailSchema.empty().optional(),
		skills: z.array(z.string().empty()).optional(),
		tools: z.array(z.string().empty()).optional(),
		responsibilities: z.array(z.string().empty()).optional(),
		startDate: dateStringSchema,
		endDate: dateStringSchema.optional(),
		remote: z.boolean().default(false),
		current: z.boolean().default(false),
	})
	.superRefine((data, ctx) => {
		// Validation: Start date must be before end date
		if (data.startDate && data.endDate) {
			const start = new Date(data.startDate);
			const end = new Date(data.endDate);
			if (start >= end) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Start date must be before end date",
					path: ["endDate"],
				});
				return;
			}
		}

		// Validation: No end date for current position
		if (data.current && data.endDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "No end date for current position",
				path: ["endDate"],
			});
			return;
		}

		// Validation: End date required for past position
		if (!data.current && !data.endDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "End date required for past position",
				path: ["endDate"],
			});
		}
	});

export const WorkExperiencesSchema = z.array(SingleWorkExperienceSchema);

export const salarySchema = z
	.object({
		min: numStringSchema
			.min(0, { message: "Minimum salary cannot be negative" })
			.refine((val) => val !== undefined, {
				message: "Minimum salary is required",
			}),
		max: numStringSchema
			.min(0, { message: "Maximum salary cannot be negative" })
			.refine((val) => val !== undefined, {
				message: "Maximum salary is required",
			}),
		currency: z.string().optional(),
	})
	.refine((data) => data.min <= data.max, {
		message: "Minimum salary must not exceed maximum salary",
		path: ["min"],
	});
