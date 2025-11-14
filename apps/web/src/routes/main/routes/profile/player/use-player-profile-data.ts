/** @format */

import { SingleWorkExperience } from "@/components/common/form/work-experience-section";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { useQuery } from "@tanstack/react-query";
import {
	PlayerEmploymentType,
	PlayerPreferredJobRole,
} from "../../onboarding/routes/index/step2/player/form-schema";
import { profileQueries } from "../query-factory";
import { AllowedProfileUserType } from "../schemas";
import { ClubReferredUserProfile } from "../types";

export type PlayerOrSupporterUser = AssertSubtype<
	AllowedProfileUserType,
	"player" | "supporter"
>;

interface BasePlayerProfileData<
	T extends PlayerOrSupporterUser = PlayerOrSupporterUser
> extends ClubReferredUserProfile {
	/**"supporter" included here cause the player libs are also used for supporter */
	userType: T;
	phone?: string;
	country?: string;
	workLocations?: string[];
	traits?: string[];
	skills?: string[];
	jobRole?: PlayerPreferredJobRole;
	employmentType?: PlayerEmploymentType;
	yearsOfExperience?: number;
	/**@deprecated Use workAvailability instead */
	availability?: string;
	workAvailability?: boolean;
	experiences?: SingleWorkExperience[];
	certifications?: string[];
	resume?: string;
	sportsHistory?: string;
	birthYear?: number;
	shirtNumber?: number;
}

interface PlayerQuestionnaireTaken<T extends PlayerOrSupporterUser>
	extends BasePlayerProfileData<T> {
	isQuestionnaireTaken: true;
	score: number;
}

interface PlayerQuestionnaireNotTaken<T extends PlayerOrSupporterUser>
	extends BasePlayerProfileData<T> {
	isQuestionnaireTaken: false;
	score?: never;
}

export type PlayerProfileData<
	T extends PlayerOrSupporterUser = PlayerOrSupporterUser
> = PlayerQuestionnaireTaken<T> | PlayerQuestionnaireNotTaken<T>;

interface Props {
	isEntity?: boolean;
}

export const usePlayerProfileData = ({ isEntity }: Props = {}) => {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: ["player", "supporter"],
	});

	return useQuery({
		...profileQueries.byUserType(cookies.userType),
		enabled: !isEntity,
	});
};
