/** @format */

import { SecurityQuestionSchema } from "@/lib/schemas/security";
import { z } from "zod";

export const PlayerStep4FormSchema = z.object({
	securityQuestion: SecurityQuestionSchema.optional(),
});

export type PlayerStep4FormValues = z.infer<typeof PlayerStep4FormSchema>;
