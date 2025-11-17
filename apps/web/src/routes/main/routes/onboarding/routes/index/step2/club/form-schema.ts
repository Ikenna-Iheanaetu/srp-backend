/** @format */

import {
	ProfileAvatarSchema,
	ProfileBannerSchema,
} from "@/components/common/form/avatar-picker";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import { z } from "zod";

export const ClubSocialsSchema = z.object({
	facebook: z.string().url("Invalid Facebook URL").empty().optional(),
	instagram: z.string().url("Invalid Instagram URL").empty().optional(),
	twitter: z.string().url("Invalid Twitter URL").empty().optional(),
});

export const ClubStep2FormScheme = z.object({
	banner: ProfileBannerSchema.optional(),
	avatar: ProfileAvatarSchema.optional(),
	website: z.string().url("Invalid website URL").empty().optional(),
	socials: ClubSocialsSchema.optional(),
} satisfies Partial<Record<keyof ClubProfileData, z.ZodType>>);

export type ClubStep2Form = z.infer<typeof ClubStep2FormScheme>;
