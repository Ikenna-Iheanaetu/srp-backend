/** @format */

import { CertificatesSchema, ResumeSchema } from "@/lib/schemas/file";
import { SkillsSchema, TraitsSchema } from "@/lib/schemas/user";
import { WorkExperiencesSchema } from "@/lib/schemas/work-experience";
import { PlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import { z } from "zod";

type FormType = Partial<Record<keyof PlayerProfileData, z.ZodTypeAny>>;

export const PlayerStep3FormSchema = z.object({
	resume: ResumeSchema.empty().optional(),
	experiences: z
		.union([WorkExperiencesSchema.optional(), z.undefined()])
		.optional(),
	skills: SkillsSchema.optional(),
	traits: TraitsSchema.optional(),
	workAvailability: z.boolean().optional(),
	certifications: CertificatesSchema.optional(),
} satisfies FormType);

export type PlayerStep3FormValues = z.infer<typeof PlayerStep3FormSchema>;
