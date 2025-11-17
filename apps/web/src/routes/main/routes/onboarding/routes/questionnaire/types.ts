/** @format */

import { SafeExtract, SafeOmit } from "@/types";
import { AllowedProfileUserType } from "../../../profile/schemas";

// Define question types (Keep these)
interface BaseQuestion {
	id: string;
	text: string;
}
interface TextQuestion extends BaseQuestion {
	type: "text";
}
interface MultipleChoiceQuestionType extends BaseQuestion {
	type: "multiple-choice";
	options: { id: string; text: string }[];
}

export type Question = TextQuestion | MultipleChoiceQuestionType;

export interface Answer {
	questionId: string;
	enunciado: string;
	answer: string;
}
// Define answer type to include question text (Keep this)

export type AnswerData = SafeOmit<Answer, "questionId">;

export type AllowedAIQuestionnaireUserType = SafeExtract<
	AllowedProfileUserType,
	"player" | "supporter" | "company"
>;
