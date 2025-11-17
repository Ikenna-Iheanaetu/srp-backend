/** @format */

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
import { SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ClubReferredUserTypeSchema } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Share2 } from "lucide-react"; // Add Mail icon
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { FormBadgeList } from "../../common/form/badge-list-field";
import { FormSelect, FormSelectTrigger } from "../../common/form/form-select";
import { FormProviderWrapper } from "../../common/form/wrapper";
import {
	generateInviteQRCodeFilename,
	generateUserInviteLink,
	InviteUserCard,
	InviteUserCardContent,
	InviteUserLinkDisplay,
	InviteUserLinkQRCode,
	InviteUserLinkSection,
	InviteUserSubmitButton,
} from "../../common/invite-user-card";
import { LoadingIndicator } from "../../common/loading-indicator";
import { invitationFormSchema } from "./invite-form-schema";
import { useSendInvite } from "./use-send-invite";

export interface ShareButtonProps {
	className?: string;
	refCode: string;
}

export const InviteAffiliatesButton = ({
	refCode,
	className,
}: ShareButtonProps) => {
	const form = useForm({
		resolver: zodResolver(invitationFormSchema),
		defaultValues: {
			emails: [],
			type: "player",
		},
	});

	const { mutate: sendInvite, isPending: isSendingInvite } = useSendInvite();

	const selectedUserType = form.watch("type");

	const generatedLink = generateUserInviteLink({
		userType: selectedUserType,
		refCode,
	});

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant={"ghost"}
					size={"icon"}
					className={cn(className)}>
					<Share2 className="size-6 text-current" />
				</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Affiliate Invitation</DialogTitle>
					<DialogDescription>
						Invite users to affiliate to your club.
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

							<FormSelect
								control={form.control}
								path="type"
								label="Select Affiliate Type">
								<FormSelectTrigger className="w-fit capitalize">
									<SelectValue placeholder="Affiliate Type" />
								</FormSelectTrigger>

								<SelectContent>
									{ClubReferredUserTypeSchema.options.map(
										(type) => (
											<SelectItem
												key={type}
												value={type}
												className="capitalize">
												{type}
											</SelectItem>
										),
									)}
								</SelectContent>
							</FormSelect>

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
							filename={generateInviteQRCodeFilename(
								selectedUserType,
							)}
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
