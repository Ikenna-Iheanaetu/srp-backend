/** @format */

import { SecurityQuestionSchema } from "@/lib/schemas/security";
import { z } from "zod";

export const CompanyStep2FormSchema = z.object({
	securityQuestion: SecurityQuestionSchema,
});

export type CompanyStep2Form = z.infer<typeof CompanyStep2FormSchema>;
