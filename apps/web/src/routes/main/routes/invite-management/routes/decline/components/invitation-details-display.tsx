/** @format */

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React from "react";
import { DeclineInviteParams } from "../hooks/use-decline-search-params";

const InvitationSkeletonLoader: React.FC = () => (
	<div className="space-y-1">
		<div className="flex items-center gap-2">
			<span className="font-medium">Role:</span>
			<Skeleton className="h-4 w-24" />
		</div>
		<div className="flex items-center gap-2">
			<span className="font-medium">Invited by:</span>
			<Skeleton className="h-4 w-28" />
		</div>
	</div>
);

type LoadedInvitationDetailsProps = Prettify<
	Pick<DeclineInviteParams, "email" | "role"> & {
		invitedBy: string;
	}
>;

const LoadedInvitationDetails: React.FC<LoadedInvitationDetailsProps> = ({
	email,
	role,
	invitedBy,
}) => (
	<div className="space-y-2">
		<p className="capitalize">
			<span className="font-medium">Role:</span> {role}
		</p>
		<p>
			<span className="font-medium">Invited by:</span> {invitedBy}
		</p>
		<p>
			<span className="font-medium">Email:</span> {email}
		</p>
	</div>
);

interface InvitationDetailsDisplayProps {
	isClubReferredInvite: boolean;
	handleRefetch: () => void;
	details: LoadedInvitationDetailsProps;
	isLoadingDetails: boolean;
	isLoadingError: boolean;
}

const InvitationDetailsDisplay: React.FC<InvitationDetailsDisplayProps> = ({
	details,
	isLoadingDetails,
	isClubReferredInvite,
	isLoadingError,
	handleRefetch,
}) => (
	<div
		className={cn(
			"bg-gray-50 border border-gray-200 rounded-lg p-4",
			isLoadingDetails && "animate-pulse"
		)}>
		<h3 className="font-semibold text-gray-900 mb-2 text-sm">
			Invitation Details
		</h3>
		<div className="space-y-1 text-sm text-gray-600">
			{isLoadingDetails ? (
				<InvitationSkeletonLoader />
			) : isLoadingError ? (
				<div className="flex flex-col gap-2">
					<p className="text-gray-500 italic">
						Unable to load invitation details
					</p>

					{isClubReferredInvite && (
						<Button
							type="button"
							className="button"
							onClick={() => void handleRefetch()}>
							Retry
						</Button>
					)}
				</div>
			) : (
				<LoadedInvitationDetails {...details} />
			)}
		</div>
	</div>
);

export { InvitationDetailsDisplay };
export type { InvitationDetailsDisplayProps };
