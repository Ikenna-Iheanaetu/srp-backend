/** @format */

import { ColorSchema } from "@/lib/schemas";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import { z } from "zod";

export const ClubAddressSchema = z.object({
	street: z.string().default(""),
	city: z.string().default(""),
	postalCode: z.coerce
		.number()
		.min(10000, { message: "Postal code must be a 5-digit number." })
		.max(99999, { message: "Postal code must be a 5-digit number." })
		.default(12345),
});

export type ClubAddress = z.infer<typeof ClubAddressSchema>;

export const ClubStep1Schema = z.object({
	category: z.string().empty().optional(),
	about: z
		.string()
		.min(10, "Club history must be at least 10 characters")
		.empty()
		.optional(),
	address: ClubAddressSchema.optional(),
	phone: z.string().empty().optional(),
	preferredColor: ColorSchema.empty().optional(),
	region: z.string().empty().optional(),
} satisfies Partial<Record<keyof ClubProfileData, z.ZodType>>);

export type ClubStep1Form = z.infer<typeof ClubStep1Schema>;
