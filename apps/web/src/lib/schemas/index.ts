/** @format */

import { z } from "zod";

/** 5MB limit */
export const DEFAULT_FILE_SIZE_LIMIT = 5 * 1024 * 1024;

/**@deprecated Use `z.string()` instead.
 *
 * The original purpose has turned out to cause more problem than it solves */
export const baseStringSchema = z.string().min(1, "Required");

export const baseNameSchema = z.string().min(1, {
	message: "Name is required",
});

export const emailSchema = z.string().email({
	message: "Invalid email address",
});

export const dateStringSchema = z
	.string()
	.datetime()
	.refine((d) => !isNaN(Date.parse(d)), "Invalid date");

export const numStringSchema = z.coerce.number({
	message: "Enter a valid number",
});

export const phoneNumberRegex = /^\+?[1-9]\d{1,15}$/;
export const PhoneNumberSchema = z
	.string()
	.regex(
		phoneNumberRegex,
		"Invalid phone number (must be in international format, e.g., +2349165609345)"
	);
export const IntPosNumSchema = z
	.union([
		z.coerce
			.number({ invalid_type_error: "Must be a number" })
			.int({ message: "Must be an integer" }),
		z.undefined(),
	])
	.empty();

export const ColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
	message:
		"Invalid color format. Must be a 7-character hex code (e.g., #RRGGBB).",
});
