/** @format */

import { ProfileAvatarSchema } from "@/components/common/form/avatar-picker";
import { IntPosNumSchema } from "@/lib/schemas";
import {
	AboutMeSchema,
	AddressSchema,
	CountrySchema,
} from "@/lib/schemas/user";
import { PlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import { z } from "zod";

export const PlayerStep1Schema = z.object({
	avatar: ProfileAvatarSchema.empty().optional(),
	about: AboutMeSchema.empty().optional(),
	address: AddressSchema.empty().optional(),
	industry: z.string().empty().optional(),
	country: CountrySchema.empty().optional(),
	birthYear: IntPosNumSchema.empty().optional(),
	shirtNumber: IntPosNumSchema.empty().optional(),
	yearsOfExperience: IntPosNumSchema.empty().optional(),
	sportsHistory: AboutMeSchema.empty().optional(),
} satisfies Partial<Record<keyof PlayerProfileData, z.ZodType>>);

export type PlayerStep1Form = z.infer<typeof PlayerStep1Schema>;
