/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageOff } from "lucide-react";
import React from "react";
import { useAffiliatingClubQuery } from "../hooks/use-affiliating-club-query";
import { useSignupSearchParams } from "../hooks/use-signup-search-params";
import { RefCodeSchema } from "../form-schema";

/**Only renders for user types referred by club. */
export const ClubReferralBanner: React.FC = () => {
	const { isEnabled, isLoading, club, error } = useAffiliatingClubQuery();
	const [{ refCode: refCodeFromParams }] = useSignupSearchParams();
	const isValidRefCode = RefCodeSchema.safeParse(refCodeFromParams).success;
	return isEnabled ? (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex items-center gap-4">
						<Avatar className="size-24">
							<AvatarImage
								src={club?.avatar}
								className="object-cover"
							/>

							<AvatarFallback>
								{(() => {
									if (isValidRefCode) {
										if (isLoading) {
											return <LoadingIndicator />;
										}
										if (error) {
											return (
												<ImageOff className="text-red-500" />
											);
										}
										return <ImageOff />; // only renders when club is fetched and <AvatarImage /> fails
									}
									return (
										<ImageOff className="text-red-500" />
									);
								})()}
							</AvatarFallback>
						</Avatar>

						<h2 className="text-3xl text-zinc-500 font-medium capitalize truncate">
							{(() => {
								if (isValidRefCode) {
									if (isLoading) {
										return "Loading club data...";
									}
									if (error) {
										return (
											<span className="text-red-500">
												Error loading club data
											</span>
										);
									}

									return club?.name;
								}

								return (
									<span className="text-red-500">
										Valid referral code required
									</span>
								);
							})()}
						</h2>
					</div>
				</TooltipTrigger>

				{!isValidRefCode && (
					<TooltipContent className="text-red-500">
						<p>
							Use the referral code input to enter valid ref code.
						</p>
					</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>
	) : (
		<p className="text-red-500">
			Cannot display affiliating club info. Conditions not met.
		</p>
	);
};
