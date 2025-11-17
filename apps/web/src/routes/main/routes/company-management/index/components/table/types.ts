/** @format */

import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";

export interface Company {
	id: string;
	name: string;
	club: ClubProfileData;
}
