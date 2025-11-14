/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { getErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SelectedClub } from "./club-select";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

interface InviteCompanyParams {
	emails: string[];
	clubId: string;
}

export const ADMIN_INVITE_COMPANIES_ENDPOINT = "/admin/invite-companies";

type InviteCompaniesApiResponse = ApiSuccessResponse<{
	data: {
		skippedEmails: { email: string; reason: string }[];
	};
}>;

export const useInviteCompanies = () => {
	return useMutation({
		mutationFn: async (variables: {
			emails: string[];
			club: SelectedClub;
		}) => {
			const response =
				await apiAxiosInstance.post<InviteCompaniesApiResponse>(
					ADMIN_INVITE_COMPANIES_ENDPOINT,
					{
						clubId: variables.club.id,
						emails: variables.emails,
					} satisfies InviteCompanyParams,
				);
			return response.data;
		},
		onSuccess: (response, { emails: companies, club }) => {
			const { skippedEmails } = response.data;
			const numOfSuccessfulInvites =
				companies.length - skippedEmails.length;

			if (numOfSuccessfulInvites > 0) {
				toast.success(
					`Successfully invited ${numOfSuccessfulInvites} company(s).`,
					{
						description: `Affiliated club: ${club.name}`,
					},
				);
			}

			if (skippedEmails.length > 0) {
				toast.warning(
					`Skipped ${skippedEmails.length} invitation(s).`,
					{
						description: (
							<ul className="flex flex-col gap-2">
								{skippedEmails.map(({ email, reason }) => (
									<li key={email}>
										{email}: {reason}
									</li>
								))}
							</ul>
						),
						duration: 5000,
					},
				);
			}
		},
		onError: (error, { emails: companies, club }) => {
			toast.error(
				`Invitation of ${companies.length} company(s) to club - ${club.name} failed`,
				{
					description: getErrorMessage(error),
				},
			);
		},
		meta: {
			errorMessage: "none",
		},
	});
};
