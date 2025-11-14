/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { AUTH_REQUEST_DEFAULTS } from "@/routes/auth/constants";
import { ClubReferredUserTypeSchema } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import React from "react";
import { toast } from "sonner";
import { isValidDeclineParams } from "../utils";
import { useDeclineSearchParams } from "./use-decline-search-params";

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

const fetchAffiliatingClubData = async (refCode: string) => {
	const response = await apiAxiosInstance.get<ClubProfileData>(
		"/get-club/" + refCode,
		AUTH_REQUEST_DEFAULTS
	);

	const data = response.data;
	data.avatar = getFileNameUrl(data.avatar);
	data.banner = getFileNameUrl(data.banner);

	return data;
};

export const useAffiliatingClubQuery = (): AffiliatingClubQuery => {
	const [{ isLoading, club: fetchedClub, error: fetchError }, setQueryState] =
		React.useState<SafeOmit<AffiliatingClubQuery, "isEnabled">>({
			isLoading: true,
			club: null,
			error: null,
		});

	const [declineParams] = useDeclineSearchParams();
	const isClubAffiliatedInvite = ClubReferredUserTypeSchema.safeParse(
		declineParams.role
	).success;

	const isEnabled =
		isValidDeclineParams(declineParams) && isClubAffiliatedInvite;

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
					const data = await fetchAffiliatingClubData(
						declineParams.refCode
					);
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
	}, [declineParams.refCode, isEnabled]);

	const club = isEnabled ? fetchedClub : null;
	const error = isEnabled ? fetchError : null;

	return React.useMemo(
		() =>
			({
				isEnabled,
				isLoading,
				club,
				error,
			} as AffiliatingClubQuery),
		[club, error, isEnabled, isLoading]
	);
};
