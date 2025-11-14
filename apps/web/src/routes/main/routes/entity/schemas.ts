/** @format */

import { z } from "zod";
import {
	AllowedProfileUserType,
	AllowedProfileUserTypeSchema,
} from "../profile/schemas";

export const EntityProfileParamsSchema = z.object({
	userType: AllowedProfileUserTypeSchema.exclude(["club"]), // club is not supported yet
	id: z.string(),
});

export type EntityProfileParams<
	T extends SafeExclude<AllowedProfileUserType, "club"> = SafeExclude<
		AllowedProfileUserType,
		"club"
	>
> = z.infer<typeof EntityProfileParamsSchema> & {
	userType: T;
};

export interface EntityProfileLocationState {
	isAdminViewUnApprovedUser: boolean;
}
export const isEntityLocationState = (
	state: unknown
): state is EntityProfileLocationState =>
	!!state &&
	typeof state === "object" &&
	"isAdminViewUnApprovedUser" in state &&
	typeof state.isAdminViewUnApprovedUser === "boolean";
