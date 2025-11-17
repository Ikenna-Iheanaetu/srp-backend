/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { FormInput } from "@/components/common/form/input";
import { FormProviderWrapper } from "@/components/common/form/wrapper";
import { LinkButton } from "@/components/common/link-btn";
import LoadingIndicator from "@/components/common/loading-indicator";
import SiteLogo from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DISPLAY_LAYOUT_CONTAINER_STYLES } from "@/constants";
import { cn } from "@/lib/utils";
import {
	ClubReferredUserType,
	ClubReferredUserTypeSchema,
} from "@/routes/auth/signup/routes/signup-form/form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InvalidInvitationParamsWarning } from "./components/invalid-invitation-params-warning";
import {
	InvitationDetailsDisplay,
	InvitationDetailsDisplayProps,
} from "./components/invitation-details-display";
import { RightSidebar } from "./components/right-sidebar";
import { useAffiliatingClubQuery } from "./hooks/use-affiliating-club-query";
import {
	DeclineMutationVariables,
	useDeclineInvite,
} from "./hooks/use-decline-invite";
import { useDeclineSearchParams } from "./hooks/use-decline-search-params";
import { isValidDeclineParams } from "./utils";
import { generateUserInviteLink } from "@/components/common/invite-user-card";

const declineFormSchema = z.object({
	reason: z
		.string()
		.max(500, "Reason must be less than 500 characters")
		.empty()
		.optional(),
});

type DeclineFormData = z.infer<typeof declineFormSchema>;

export default function DeclineInvitePage() {
	const form = useForm<DeclineFormData>({
		resolver: zodResolver(declineFormSchema),
	});

	const [declineInviteParams] = useDeclineSearchParams();

	const isClubAffiliateInvite = React.useCallback(
		(role: unknown): role is ClubReferredUserType =>
			ClubReferredUserTypeSchema.safeParse(role).success,
		[],
	);

	const {
		club: referralClubData,
		isLoading: isLoadingReferralClub,
		error: loadingClubError,
	} = useAffiliatingClubQuery();

	const isLoadingDetailsError = isClubAffiliateInvite(
		declineInviteParams.role,
	)
		? !!loadingClubError
		: false;

	const isLoadingDetails = isClubAffiliateInvite(declineInviteParams.role)
		? isLoadingReferralClub
		: false;

	const declineMutation = useDeclineInvite();

	const [isConfirmingDecline, setIsConfirmingDecline] = useState(false);
	const isDeclineEnabled =
		isValidDeclineParams(declineInviteParams) &&
		!loadingClubError &&
		!isConfirmingDecline &&
		!declineMutation.isPending &&
		!isLoadingDetails;

	const handleConfirmDecline = () => {
		const { reason } = form.getValues();

		declineMutation.mutate({
			reason,
			email: declineInviteParams.email,
			role: declineInviteParams.role,
			otp: declineInviteParams.otp,
			referralClub: referralClubData,
		} as DeclineMutationVariables);
	};

	const invitationDetails = useMemo(():
		| InvitationDetailsDisplayProps["details"]
		| undefined => {
		if (isValidDeclineParams(declineInviteParams) && !isLoadingDetails) {
			return {
				email: declineInviteParams.email,
				role: declineInviteParams.role,
				invitedBy: isClubAffiliateInvite(declineInviteParams.role)
					? // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
						referralClubData?.name!
					: "Admin Team",
			};
		}
	}, [
		declineInviteParams,
		isClubAffiliateInvite,
		isLoadingDetails,
		referralClubData?.name,
	]);

	return (
		<>
			<div className={cn(DISPLAY_LAYOUT_CONTAINER_STYLES, "bg-gray-50")}>
				{/* Main Content */}
				<div className="flex h-full flex-col items-center gap-4 p-4 pb-0 lg:p-8">
					<SiteLogo variant="dark" />
					<Card className="w-full max-w-lg flex-1 overflow-auto border-0 shadow-lg tw-scrollbar">
						<CardHeader className="pb-4 text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
								<X className="h-8 w-8 text-red-600" />
							</div>
							<CardTitle className="text-2xl font-bold text-gray-900">
								Decline Invitation
							</CardTitle>
							<CardDescription className="mt-2 text-base text-gray-600">
								We&apos;re sorry to see you won&apos;t be
								joining us. Your feedback helps us improve.
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-6">
							{isValidDeclineParams(declineInviteParams) ? (
								<InvitationDetailsDisplay
									details={invitationDetails!}
									isLoadingDetails={isLoadingDetails}
									isLoadingError={isLoadingDetailsError}
									isClubReferredInvite={isClubAffiliateInvite(
										declineInviteParams.role,
									)}
									handleRefetch={() => location.reload()}
								/>
							) : (
								<InvalidInvitationParamsWarning />
							)}

							<FormProviderWrapper
								form={form}
								onSubmit={handleConfirmDecline}>
								<FormInput
									control={form.control}
									path="reason"
									variant="textarea"
									rows={4}
									placeholder="Help us understand why you're declining this invitation..."
									className="resize-none"
									disabled={!isDeclineEnabled}
								/>

								<p className="text-xs text-gray-500">
									This feedback will help us improve our
									invitation process.
								</p>

								<Button
									type="button"
									onClick={() => setIsConfirmingDecline(true)}
									disabled={!isDeclineEnabled}
									className="flex-1 bg-red-600 font-semibold text-white hover:bg-red-700">
									{declineMutation.isPending ? (
										<>
											<LoadingIndicator />
											Declining...
										</>
									) : (
										"Decline Invitation"
									)}
								</Button>
							</FormProviderWrapper>

							{isValidDeclineParams(declineInviteParams) && (
								<p className="text-center text-xs text-gray-500">
									Changed your mind?{" "}
									<LinkButton
										to={generateUserInviteLink({
											userType: declineInviteParams.role,
											refCode:
												declineInviteParams.refCode,
										})}
										variant={"link"}
										replace
										className="p-0 text-xs">
										Accept invitation instead
									</LinkButton>
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				<RightSidebar />
			</div>

			{/* Critical Action Dialog */}
			<CriticalActionConfirmationDialog
				open={isConfirmingDecline}
				onOpenChange={setIsConfirmingDecline}
				title="Decline Invitation"
				description={`This action cannot be undone. ${
					isClubAffiliateInvite(declineInviteParams.role)
						? "You will need to be re-invited to join this club"
						: "Your club will need to be re-invited to join this platform"
				}. Are you sure you want to decline this invitation?`}
				confirmText="decline"
				confirmButtonText="Decline Invitation"
				onConfirm={handleConfirmDecline}
			/>
		</>
	);
}
