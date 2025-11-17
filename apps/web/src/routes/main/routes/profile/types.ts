/** @format */

import { ClubReferredUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { ClubProfileData } from "./club/use-fetch-profile";
import { CompanyProfileData } from "./company/use-fetch-profile";
import { PlayerProfileData } from "./player/use-player-profile-data";
import { AllowedProfileUserType } from "./schemas";

interface BaseUserProfile {
	id: string;
	name: string;
	email: string;
	userType: AllowedProfileUserType;
	/**True if the admin has approved their invitation */
	isApproved: boolean;
	/**"active" if the user's email is verified. "pending" otherwise */
	status: "pending" | "active";
	onboardingSteps?: number[];
	avatar?: string;
	about?: string;
	website?: string;
}

interface ClubReferredUserProfile extends BaseUserProfile {
	userType: ClubReferredUserType;
	isQuestionnaireTaken: boolean;
	score?: number;
	industry?: string;
	club: ClubProfileData;
	address?: string;
}

type UserProfile = PlayerProfileData | CompanyProfileData | ClubProfileData;

export type { BaseUserProfile, ClubReferredUserProfile, UserProfile };
