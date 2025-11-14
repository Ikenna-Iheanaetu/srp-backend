/** @format */

import { FormBadgeList } from "@/components/common/form/badge-list-field";
import { FormProviderWrapper } from "@/components/common/form/wrapper";
import {
	generateInviteQRCodeFilename,
	generateUserInviteLink,
	InviteUserCard,
	InviteUserCardContent,
	InviteUserLinkDisplay,
	InviteUserLinkQRCode,
	InviteUserLinkSection,
	InviteUserSubmitButton,
} from "@/components/common/invite-user-card";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";

type InviteClubsApiResponse = ApiSuccessResponse<{
	data: {
		skippedEmails: { email: string; reason: string }[];
	};
}>;

const useInviteClub = () => {
	return useMutation({
		mutationFn: async (variables: { emails: string[] }) => {
			const response =
				await apiAxiosInstance.post<InviteClubsApiResponse>(
					"/admin/invite-clubs",
					variables,
				);
			return response.data;
		},
		onSuccess: (response, { emails: companies }) => {
			const { skippedEmails } = response.data;
			const numOfSuccessfulInvites =
				companies.length - skippedEmails.length;

			if (numOfSuccessfulInvites > 0) {
				toast.success(
					`Successfully invited ${numOfSuccessfulInvites} club(s).`,
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
		onError: (error, { emails }) => {
			toast.error(`Invitation of ${emails.length} clubs(s) failed`, {
				description: getErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

const InviteClubsSchema = z.object({
	emails: z.array(z.email()).min(1, {
		error: "At least one email",
	}),
});

export const InviteClubDialog: React.FC = () => {
	const {
		mutate: sendInvite,
		isPending: isSendingInvite,
		reset,
	} = useInviteClub();

	const form = useForm({
		resolver: zodResolver(InviteClubsSchema),
		defaultValues: {
			emails: [],
		},
	});

	const generatedLink = generateUserInviteLink({
		userType: "club",
		refCode: "REF_CODE",
	});

	return (
		<Dialog
			onOpenChange={(isOpen) => {
				if (!isOpen && isSendingInvite) {
					reset(); // reset ongoing mutation when dialog closes
				}
			}}>
			<DialogTrigger asChild>
				<Button className="ml-auto flex button">Add club</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add club</DialogTitle>
					<DialogDescription className="sr-only">
						Add club by sending invite links.
					</DialogDescription>
				</DialogHeader>

				<InviteUserCard>
					<CardHeader className="sr-only">
						<CardTitle>Send Invitation Link</CardTitle>
						<CardDescription>
							Use this form to generate and send invitation links.
						</CardDescription>
					</CardHeader>

					<InviteUserCardContent>
						<FormProviderWrapper form={form} onSubmit={sendInvite}>
							<FormBadgeList
								control={form.control}
								path="emails"
								label="Send Invitation Link to:"
								placeholder="Enter email address"
								addLabel="Add Email"
								emptyMessage="No recipients added"
								type="email"
								itemSchema={z.email()}
							/>

							<InviteUserSubmitButton
								disabled={
									isSendingInvite || !form.formState.isValid
								}>
								{isSendingInvite ? (
									<>
										Sending <LoadingIndicator />
									</>
								) : (
									"Send invite"
								)}
							</InviteUserSubmitButton>
						</FormProviderWrapper>

						<InviteUserLinkSection>
							<Label>Generated link</Label>
							<InviteUserLinkDisplay inviteLink={generatedLink} />
						</InviteUserLinkSection>

						<InviteUserLinkQRCode
							value={generatedLink}
							filename={generateInviteQRCodeFilename("club")}
						/>
					</InviteUserCardContent>
				</InviteUserCard>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant={"outline"}>Cancel</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
