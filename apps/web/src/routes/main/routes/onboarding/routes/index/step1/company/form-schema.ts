/** @format */

import { ProfileAvatarSchema } from "@/components/common/form/avatar-picker";
import { AboutMeSchema, AddressSchema } from "@/lib/schemas/user";
import { CompanyProfileData } from "@/routes/main/routes/profile/company/use-fetch-profile";
import { z } from "zod";
import { SecondaryAvatarSchema } from "./secondary-avatar";

export const COMPANY_SECONDARY_REGIONS_MAX = 4;

export const CompanyStep1Schema = z.object({
	avatar: ProfileAvatarSchema.empty().optional(),
	secondaryAvatar: SecondaryAvatarSchema.empty().optional(),
	industry: z.string().empty().optional(),
	about: AboutMeSchema.empty().optional(),
	address: AddressSchema.empty().optional(),
	tagline: z.string().empty().optional(),
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
} satisfies Partial<Record<keyof CompanyProfileData, z.ZodType>>);

export type CompanyStep1Form = z.infer<typeof CompanyStep1Schema>;
