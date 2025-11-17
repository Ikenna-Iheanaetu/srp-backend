/** @format */

import { z } from "zod";
import { DEFAULT_FILE_SIZE_LIMIT } from "./index";

const certificateSchema = z
	.union([
		z.string().optional(),
		z
			.instanceof(File, {
				message: "Upload a document",
			})
			.refine(
				(file) => file.size <= DEFAULT_FILE_SIZE_LIMIT,
				"Each certificate file size must be less than 5MB"
			),
		/* .refine(
				(file) => /\.(jpg|jpeg|png|pdf)$/i.test(file.name),
				"Certificate must be a valid file (jpg, jpeg, png, or pdf)"
			), */
	])
	.optional();
export type Certificate = z.infer<typeof certificateSchema>;

export const CertificatesSchema = z
	.array(certificateSchema.optional())
	.max(5, "Maximum 5 certificates allowed");

export const ResumeSchema = z.union([
	z.string().optional(),
	z
		.instanceof(File, {
			message: "Upload a document",
		})
		.refine(
			(file) => file.size <= DEFAULT_FILE_SIZE_LIMIT,
			"Resume file size must be less than 5MB"
		)
		.refine(
			(file) => /\.(jpg|jpeg|png|pdf)$/i.test(file.name),
			"Resume must be a valid file (jpg, jpeg, png, or pdf)"
		),
]);
