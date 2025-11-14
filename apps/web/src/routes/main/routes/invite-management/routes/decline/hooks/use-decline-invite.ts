/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { capitalize } from "@/lib/helper-functions";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import {
	AllowedSignupUserType,
	ClubReferredUserType,
} from "@/routes/auth/signup/routes/signup-form/form-schema";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import { useMutation } from "@tanstack/react-query";
import { href, useNavigate } from "react-router";
import { toast } from "sonner";

interface DeclineInviteRequestBody {
	email: string;
	otp: string;
	reason?: string;
}

export type DeclineMutationVariables = DeclineInviteRequestBody &
	(
		| {
				role: ClubReferredUserType;
				referralClub: ClubProfileData;
		  } // club invited the user
		| {
				role: SafeExtract<AllowedSignupUserType, "club">;
				referralClub?: never;
		  }
	); // admin invited the club

export const useDeclineInvite = () => {
	const navigate = useNavigate();
	return useMutation({
		mutationFn: async ({
			email,
			reason,
			otp,
		}: DeclineMutationVariables) => {
			await apiAxiosInstance.post(
				"/decline/verify",
				{ email, reason, otp } satisfies DeclineInviteRequestBody,
				{
					skipAuthHeader: true,
					skipUserTypePrefix: true,
				}
			);
		},
		onSuccess: (_, { referralClub, role }) => {
			const message = referralClub
				? `Your invitation to be an affiliated ${capitalize(
						role
				  )} to club - ${
						referralClub.name
				  } has been declined successfully.` // club invited a user
				: "Your club invitation to our platform has been declined successfully"; // admin invited a club
			toast.success(message);
			void navigate(href("/"), {
				replace: true,
			}); // Take the user to home page
		},
		onError: (error) => {
			toast.error("Error occured while declining the invitation", {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
