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
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod/v4";
import { ClubSelect, SelectedClub } from "./club-select";
import { useInviteCompanies } from "./use-invite-companies";

/**
 * @deprecated This path is for backward compatability and is temporary. Please update your imports to the "./club-select.tsx" file.
 */
export * from "./club-select";

const InviteCompaniesSchema = z.object({
	emails: z.array(z.email()).min(1, {
		error: "At least one email",
	}),
});

export const CompanyInviteDialog: React.FC = () => {
	const [selectedClub, setSelectedClub] = React.useState<SelectedClub | null>(
		null,
	);
	const {
		mutate: sendInvite,
		isPending: isSendingInvite,
		reset,
	} = useInviteCompanies();

	const form = useForm({
		resolver: zodResolver(InviteCompaniesSchema),
		defaultValues: {
			emails: [],
		},
	});

	const generatedLink = generateUserInviteLink({
		userType: "company",
		refCode: selectedClub?.refCode ?? "",
	});

	return (
		<Dialog
			onOpenChange={(isOpen) => {
				if (!isOpen && isSendingInvite) {
					reset(); // reset ongoing mutation when dialog closes
				}
			}}>
			<DialogTrigger asChild>
				<Button className="ml-auto flex button">Add company</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add company</DialogTitle>
					<DialogDescription className="sr-only">
						Add company by sending invite link.
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
						<FormProviderWrapper
							form={form}
							onSubmit={({ emails }) => {
								if (!selectedClub) return;
								sendInvite({
									emails,
									club: selectedClub,
								});
							}}>
							<div className="relative flex flex-col gap-2">
								<Label>Club to affiliate</Label>
								<ClubSelect
									selectedClub={selectedClub}
									onSelectClub={setSelectedClub}
								/>
								{!selectedClub && (
									<p className="form-error static">
										Please select a club
									</p>
								)}
							</div>

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
									isSendingInvite ||
									!form.formState.isValid ||
									!selectedClub
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
							filename={generateInviteQRCodeFilename("company")}
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
