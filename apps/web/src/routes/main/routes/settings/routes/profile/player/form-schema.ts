/** @format */

import { ProfileAvatarSchema } from "@/components/common/form/avatar-picker";
import { CertificatesSchema, ResumeSchema } from "@/lib/schemas/file";
import {
	AboutMeSchema,
	BirthYearSchema,
	CountrySchema,
	SkillsSchema,
	TraitsSchema,
	YearsOfExperienceSchema,
} from "@/lib/schemas/user";
import { WorkExperiencesSchema } from "@/lib/schemas/work-experience";
import {
	PlayerEmploymentTypeSchema,
	PlayerPreferredJobRoleSchema,
	PlayerWorkLocationsSchema,
} from "@/routes/main/routes/onboarding/routes/index/step2/player/form-schema";
import { PlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import { z } from "zod";

// Combined schema object
export const PlayerProfileSettingsFormSchema = z.object({
	yearsOfExperience: YearsOfExperienceSchema.empty().optional(),
	about: AboutMeSchema.empty().optional(),
	skills: SkillsSchema.optional(),
	traits: TraitsSchema.optional(),
	resume: ResumeSchema.empty().optional(),
	certifications: CertificatesSchema.optional(),
	avatar: ProfileAvatarSchema.empty().optional(),
	address: CountrySchema.empty().optional(),
	country: CountrySchema.empty().optional(),
	workLocations: PlayerWorkLocationsSchema.optional(),
	experiences: WorkExperiencesSchema.optional(),
	employmentType: PlayerEmploymentTypeSchema.optional(),
	birthYear: BirthYearSchema.optional(),
	sportsHistory: AboutMeSchema.empty().optional(),
	shirtNumber: z.coerce
		.number({ invalid_type_error: "Must be a number" })
		.int({ message: "Must be an integer" })
		.empty()
		.optional(),
	workAvailability: z.boolean().optional(),
	jobRole: PlayerPreferredJobRoleSchema.optional(),
} satisfies Partial<Record<keyof PlayerProfileData, z.ZodTypeAny>>);

export type PlayerProfileSettingsForm = z.infer<
	typeof PlayerProfileSettingsFormSchema
>;
