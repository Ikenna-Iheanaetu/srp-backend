/** @format */

import { useQuery } from "@tanstack/react-query";
import { ClubAddress } from "../../onboarding/routes/index/step1/club/form-schema";
import { profileQueries } from "../query-factory";
import { BaseUserProfile } from "../types";

export interface ClubProfileData extends BaseUserProfile {
	userType: "club";
	userId?: string;
	industry?: string;
	banner?: string;
	tagline?: string;
	phone?: string;
	address?: ClubAddress;
	jobs?: {
		id: string;
		title: string;
		status: "open" | "closed";
		numOfApplications: number;
	}[];
	socials?: {
		facebook?: string;
		instagram?: string;
		twitter?: string;
	};
	preferredColor?: string;
	category?: string;
	refCode: string;
	website?: string;
	region?: string;
}

export const useClubProfile = () => {
	return useQuery({ ...profileQueries.byUserType("club") });
};
