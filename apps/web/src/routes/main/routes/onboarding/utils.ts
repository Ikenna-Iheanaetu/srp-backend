/** @format */

import type { CompanyProfileData } from "../profile/company/use-fetch-profile";
import type { PlayerProfileData } from "../profile/player/use-player-profile-data";
import { BaseUserProfile } from "../profile/types";
import { ALLOWED_AI_QUESTIONNAIRE_USER_TYPES } from "./routes/questionnaire/constants";

/**Checks if user profile data has remaining onboarding steps for "/onboarding" route */
export const checkHasRemainingSteps = (
	remainingSteps: BaseUserProfile["onboardingSteps"]
) => {
	if (!remainingSteps || remainingSteps.length === 0) {
		return false;
	}
	return true;
};

/**Checks if user profile data includes onboarding ai questionnaire */
export const checkIncludesQuestionnaire = (
	profileData: BaseUserProfile
): profileData is CompanyProfileData | PlayerProfileData =>
	ALLOWED_AI_QUESTIONNAIRE_USER_TYPES.some(
		(t) => t === profileData.userType
	) && "isQuestionnaireTaken" in profileData;
