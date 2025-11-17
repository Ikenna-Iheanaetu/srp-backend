/** @format */

import { AllowedAIQuestionnaireUserType } from "./types";

export const ALLOWED_AI_QUESTIONNAIRE_USER_TYPES = [
	"player",
	"supporter",
	"company",
] as const satisfies AllowedAIQuestionnaireUserType[];
