/** @format */

import {
	ProfileAvatarSchema,
	ProfileBannerSchema,
} from "@/components/common/form/avatar-picker";
import { ColorSchema } from "@/lib/schemas";
import { ClubAddressSchema } from "@/routes/main/routes/onboarding/routes/index/step1/club/form-schema";
import { ClubSocialsSchema } from "@/routes/main/routes/onboarding/routes/index/step2/club/form-schema";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import { z } from "zod";

export const ProfileEditSchema = z.object({
	banner: ProfileBannerSchema.empty().optional(),

	avatar: ProfileAvatarSchema.empty().optional(),

	name: z.string().max(50, "Club name too long").empty().optional(),

	category: z.string().empty().optional(),

	about: z.string().max(200, "Too long").empty().optional(),

	phone: z.string().empty().optional(),

	website: z.string().url("Invalid website URL").empty().optional(),

	socials: ClubSocialsSchema.optional(),

	preferredColor: ColorSchema.empty().optional(),

	address: ClubAddressSchema.optional(),

	region: z.string().empty().optional(),
} satisfies Partial<Record<keyof ClubProfileData, z.ZodTypeAny>>);

export type ProfileEditForm = z.infer<typeof ProfileEditSchema>;
