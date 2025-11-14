/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { queryOptions } from "@tanstack/react-query";
import { ClubProfileData } from "./club/use-fetch-profile";
import { CompanyProfileData } from "./company/use-fetch-profile";
import { PlayerProfileData } from "./player/use-player-profile-data";
import { AllowedProfileUserType } from "./schemas";

interface ApiProfileResponse {
	company: CompanyProfileData;
	club: ClubProfileData;
	player: PlayerProfileData<"player">;
	supporter: PlayerProfileData<"supporter">;
}

async function fetchProfile<TUserType extends AllowedProfileUserType>() {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{
			hasData: true;
			data: ApiProfileResponse[TUserType];
		}>
	>("/profile");
	return response.data.data;
}

export const profileQueries = {
	all: () => ["user-profile"] as const,

	byUserType: <T extends AllowedProfileUserType>(userType: T) =>
		queryOptions({
			queryKey: [...profileQueries.all(), userType] as const,
			queryFn: fetchProfile<T>,
		}),
};

export type {
	ApiProfileResponse,
	/**@deprecated Use the {@link ApiProfileResponse} export instead. */
	ApiProfileResponse as ServerProfileDataResponse,
};
