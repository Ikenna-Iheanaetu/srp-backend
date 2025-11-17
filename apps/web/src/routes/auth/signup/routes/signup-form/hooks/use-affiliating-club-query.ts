/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import React from "react";
import { toast } from "sonner";
import {
	AuthSignupForm,
	ClubReferredUserTypeSchema,
	RefCodeSchema,
} from "../form-schema";
import { useSignupSearchParams } from "./use-signup-search-params";
import { useUserTypeFromParams } from "./use-user-type-from-params";

type AffiliatingClubQuery =
	| {
			isEnabled: false;
			isLoading: false;
			club: null;
			error: null;
	  }
	| {
			isEnabled: true;
			isLoading: true;
			club: null;
			error: null;
	  }
	| {
			isEnabled: true;
			isLoading: false;
			club: ClubProfileData;
			error: null;
	  }
	| {
			isEnabled: true;
			isLoading: false;
			club: null;
			error: string;
	  };

const fetchAffiliatingClubData = async (
	refCode: AuthSignupForm["refCode"],
): Promise<ClubProfileData> => {
	const response = await apiAxiosInstance.get<
		ApiSuccessResponse<{ data: ClubProfileData }>
	>("/get-club/" + refCode, {
		skipAuthHeader: true,
		skipAuthRefresh: true,
		skipUserTypePrefix: true,
	});

	return response.data.data;
};

export const useAffiliatingClubQuery = (): AffiliatingClubQuery => {
	const [{ isLoading, club: fetchedClub, error: fetchError }, setQueryState] =
		React.useState<SafeOmit<AffiliatingClubQuery, "isEnabled">>({
			isLoading: true,
			club: null,
			error: null,
		});

	const [{ refCode: refCodeFromParams }] = useSignupSearchParams();
	const refCode = RefCodeSchema.safeParse(refCodeFromParams).data;

	const { userType } = useUserTypeFromParams();
	const affiliatedUserType =
		ClubReferredUserTypeSchema.safeParse(userType).data;

	const isEnabled = !!(refCode && affiliatedUserType);
	console.log("isEnabled", isEnabled);

	React.useEffect(() => {
		let ignore = false;

		const handleFetch = async () => {
			if (isEnabled) {
				setQueryState({
					isLoading: true,
					club: null,
					error: null,
				});
				try {
					const data = await fetchAffiliatingClubData(refCode);
					if (ignore) {
						return;
					}
					setQueryState({
						isLoading: false,
						club: data,
						error: null,
					});
				} catch (e) {
					if (ignore) {
						return;
					}

					const error = getApiErrorMessage(e);
					setQueryState({
						isLoading: false,
						club: null,
						error,
					});
					toast.error("Error fetching club info", {
						description: error,
					});
				} finally {
					setQueryState((prev) => ({
						...prev,
						isLoading: false,
					}));
				}
			}
		};

		void handleFetch();

		return () => {
			ignore = true; // when a new fetch starts ignore the result from last fetch
		};
	}, [isEnabled, refCode]);

	const club = isEnabled ? fetchedClub : null;
	const error = isEnabled ? fetchError : null;

	return React.useMemo(
		() =>
			({
				isEnabled,
				isLoading,
				club,
				error,
			}) as AffiliatingClubQuery,
		[club, error, isEnabled, isLoading],
	);
};
