/** @format */

import { UserTypeSchema } from "@/lib/schemas/user";
import { z } from "zod";

const AllowedProfileUserTypeSchema = UserTypeSchema.exclude(["admin"], {
	message: "User doesn't have a profile page",
});
type AllowedProfileUserType = z.infer<typeof AllowedProfileUserTypeSchema>;

const ALLOWED_PROFILE_USER_TYPES = AllowedProfileUserTypeSchema.options;

export { AllowedProfileUserTypeSchema, ALLOWED_PROFILE_USER_TYPES };

export type { AllowedProfileUserType };
