/** @format */

import { EmploymentTypeEnumsSchema } from "@/lib/schemas/work-experience";
import { PlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import { z } from "zod";
import { HierarchicalPath } from "./components/role-section/job-taxonomy-dropdown";

export const PLAYER_MAX_SECONDARY_EMPLOYMENT_TYPES = 5;
export const PLAYER_MAX_WORK_LOCATIONS = 5;

export const PlayerEmploymentTypeSchema = z
	.object({
		primary: EmploymentTypeEnumsSchema.optional(),
		secondary: z
			.array(EmploymentTypeEnumsSchema)
			.max(PLAYER_MAX_SECONDARY_EMPLOYMENT_TYPES, {
				message: `Only ${PLAYER_MAX_SECONDARY_EMPLOYMENT_TYPES} secondary employment types are allowed`,
			})
			.optional(),
	})
	.refine(
		(data) => {
			if (data.secondary && data.primary) {
				return !data.secondary.includes(data.primary);
			}
			return true;
		},
		{
			message:
				"Secondary employment types cannot contain the primary type.",
			path: ["secondary"],
		}
	);

export type PlayerEmploymentType = z.infer<typeof PlayerEmploymentTypeSchema>;

export const PLAYER_MAX_SECONDARY_ROLES = 4;

export const PlayerPreferredJobRoleSchema = z
	.object({
		primary: z
			.string()
			.transform((value) => value as HierarchicalPath)
			.optional(),
		secondary: z
			.array(z.string().transform((value) => value as HierarchicalPath))
			.max(PLAYER_MAX_SECONDARY_ROLES, {
				message: `Only ${PLAYER_MAX_SECONDARY_ROLES} secondary roles are allowed`,
			})
			.optional(),
	})
	.refine(
		(data) => {
			if (data.secondary && data.primary) {
				return !data.secondary.includes(data.primary);
			}
			return true;
		},
		{
			message: "Secondary roles cannot contain the primary type.",
			path: ["secondary"],
		}
	);

export type PlayerPreferredJobRole = z.infer<
	typeof PlayerPreferredJobRoleSchema
>;

export const PlayerWorkLocationsSchema = z
	.array(z.string().max(100, "Too long").empty())
	.max(PLAYER_MAX_WORK_LOCATIONS, {
		message: `Only ${PLAYER_MAX_WORK_LOCATIONS} regions are allowed`,
	});

export const PlayerStep2FormSchema = z.object({
	workLocations: PlayerWorkLocationsSchema.optional(),
	employmentType: PlayerEmploymentTypeSchema.optional(),
	jobRole: PlayerPreferredJobRoleSchema.optional(),
} satisfies Partial<Record<keyof PlayerProfileData, z.ZodTypeAny>>);

export type PlayerStep2FormValues = z.infer<typeof PlayerStep2FormSchema>;
