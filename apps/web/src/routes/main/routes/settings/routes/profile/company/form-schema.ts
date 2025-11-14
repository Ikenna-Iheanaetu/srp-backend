/** @format */

import { ProfileAvatarSchema } from "@/components/common/form/avatar-picker";
import { CountrySchema } from "@/lib/schemas/user";
import { SecondaryAvatarSchema } from "@/routes/main/routes/onboarding/routes/index/step1/company/secondary-avatar";
import { CompanyProfileData } from "@/routes/main/routes/profile/company/use-fetch-profile";
import { z } from "zod";

export const COMPANY_SECONDARY_REGIONS_MAX = 4;

export const CompanyProfileSettingsSchema = z.object({
	avatar: ProfileAvatarSchema.empty().optional(),
	secondaryAvatar: SecondaryAvatarSchema.empty().optional(),

	name: z.string().max(50, "Name too long").empty().optional(),

	industry: z.string().empty().optional(),

	tagline: z.string().max(150, "Too long").empty().optional(),

	about: z.string().max(1000, "Too long").empty().optional(),

	focus: z.string().max(100, "Too long").empty().optional(),
	country: CountrySchema.empty().optional(),
	region: z
		.object({
			primary: z.string().max(100, "Too long").empty().optional(),
			secondary: z
				.array(z.string().max(100, "Too long").empty())
				.max(COMPANY_SECONDARY_REGIONS_MAX, {
					message: `Only ${COMPANY_SECONDARY_REGIONS_MAX} regions are allowed`,
				})
				.optional(),
		})
		.optional(),
	address: z.string().max(200, "Too long").empty().optional(),
} satisfies Partial<Record<keyof CompanyProfileData, z.ZodType>>);

export type CompanyProfileSettingsForm = z.infer<
	typeof CompanyProfileSettingsSchema
>;
