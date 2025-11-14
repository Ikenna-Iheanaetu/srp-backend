/** @format */

import { useQuery } from "@tanstack/react-query";
import { profileQueries } from "../query-factory";
import { ClubReferredUserProfile } from "../types";

interface BaseData extends ClubReferredUserProfile {
	userType: "company";
	secondaryAvatar?: string;
	industry?: string;
	tagline?: string;
	focus?: string;
	preferredClubs?: string[];
	country?: string;
	region?: {
		primary: string;
		secondary: string[];
	};
}

interface CompanyQuestionnaireTaken extends BaseData {
	isQuestionnaireTaken: true;
	score: number;
	analisys_result: string;
}

interface CompanyQuestionnaireNotTaken extends BaseData {
	isQuestionnaireTaken: false;
}

export type CompanyProfileData =
	| CompanyQuestionnaireTaken
	| CompanyQuestionnaireNotTaken;

export const useCompanyProfile = () => {
	return useQuery(profileQueries.byUserType("company"));
};
