/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { queryOptions } from "@tanstack/react-query";
import { CompanyProfileData } from "../profile/company/use-fetch-profile";
import { PlayerProfileData } from "../profile/player/use-player-profile-data";
import { AllowedProfileUserType } from "../profile/schemas";
import { EntityProfileParams } from "./schemas";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

export interface ApiEntityResponseRecord {
	company: CompanyProfileData & { userId: string; chatId?: string | null };
	player: PlayerProfileData<"player"> & {
		userId: string;
		chatId?: string | null;
	};
	supporter: PlayerProfileData<"supporter"> & {
		userId: string;
		chatId?: string | null;
	};
}

// TODO: Add support for club
type CurrentlySupportedUserType = AllowedProfileUserType &
	keyof ApiEntityResponseRecord;

async function fetchEntity<TUserType extends CurrentlySupportedUserType>({
	userType,
	id,
}: EntityProfileParams<TUserType>): Promise<
	ApiEntityResponseRecord[TUserType]
> {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: ApiEntityResponseRecord[TUserType] }>
	>(`/profile/${userType}/${id}`, {
		skipUserTypePrefix: true,
	});

	return response.data.data;
}

/**@deprecated */
async function fetchUnapprovedUser<
	TUserType extends CurrentlySupportedUserType,
>({ userType, id }: EntityProfileParams<TUserType>) {
	const response = await apiAxiosInstance.get<
		ApiEntityResponseRecord[TUserType]
	>(`/admin/unapproved/${userType}/${id}`, {
		skipUserTypePrefix: true,
	});

	return response.data;
}

/**@deprecated Use the {@link EntityProfileParams} type instead. This type is to be removed soon. */
export type EntityRequestParams<
	T extends SafeExclude<AllowedProfileUserType, "club"> = SafeExclude<
		AllowedProfileUserType,
		"club"
	>,
> = EntityProfileParams<T>;

export const entityProfileQueries = {
	all: () => ["entity-profile"] as const,

	byUserType: <T extends CurrentlySupportedUserType>(
		params: EntityProfileParams<T>,
	) => {
		return queryOptions({
			queryKey: [...entityProfileQueries.all(), params] as const,
			queryFn: () => fetchEntity<T>(params),
		});
	},

	/**@deprecated Use the `byUserType` method instead. This method isn't useful again. */
	adminViewUnapprovedUser: <T extends CurrentlySupportedUserType>(
		params: EntityProfileParams<T>,
	) => {
		return queryOptions({
			queryKey: [
				...entityProfileQueries.all(),
				params,
				"admin-view-unapproved-user",
			] as const,
			queryFn: () => fetchUnapprovedUser<T>(params),
		});
	},
};
