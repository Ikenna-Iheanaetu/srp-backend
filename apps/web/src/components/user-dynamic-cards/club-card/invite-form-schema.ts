/** @format */

import { ClubReferredUserTypeSchema } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { z } from "zod";

export const invitationFormSchema = z.object({
	emails: z
		.array(z.string().email("Invalid email address"))
		.min(1, "At least one recipient is required")
		.max(3, "Maximum 3 recipients allowed"),
	type: ClubReferredUserTypeSchema,
});
export type InvitationForm = z.infer<typeof invitationFormSchema>;
