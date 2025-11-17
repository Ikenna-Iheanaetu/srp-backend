/** @format */

import { SecurityQuestionSchema } from "@/lib/schemas/security";
import { z } from "zod";

export const ClubStep3FormSchema = z.object({
	securityQuestion: SecurityQuestionSchema,
});

export type ClubStep3Form = z.infer<typeof ClubStep3FormSchema>;
