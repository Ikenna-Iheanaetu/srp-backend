/** @format */

import { getDifferenceColor } from "@/lib/helper-functions/colors";
import { getPathDominantItem } from "@/lib/helper-functions/generic-string-helpers";
import { ClubReferredUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { getPathName } from "@/routes/main/routes/onboarding/routes/index/step2/player/components/role-section/job-taxonomy-dropdown";
import { CompanyProfileData } from "@/routes/main/routes/profile/company/use-fetch-profile";
import { PlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import { ClubReferredUserProfile } from "@/routes/main/routes/profile/types";
import { SafeExclude, SafeExtract } from "@/types";
import { Shirt } from "lucide-react";
import { Badge } from "../ui/badge";
import { FlipButton } from "./flip-button";
import { LogoBanner } from "./logo-banner";

interface SharedInfo
	extends Pick<
		ClubReferredUserProfile,
		"id" | "avatar" | "name" | "industry" | "club"
	> {
	userType: ClubReferredUserType;
}

interface PlayerSupporterInfo
	extends SharedInfo,
		Pick<
			PlayerProfileData,
			"employmentType" | "shirtNumber" | "score" | "jobRole"
		> {
	userType: SafeExclude<ClubReferredUserType, "company">;
}

interface CompanyInfo
	extends SharedInfo,
		Pick<CompanyProfileData, "secondaryAvatar"> {
	userType: SafeExtract<ClubReferredUserType, "company">;
}

export type ClubReferredFrontInfo = PlayerSupporterInfo | CompanyInfo;

interface ClubReferredCardFrontProps {
	flip: () => void;
	personalInfo: ClubReferredFrontInfo;
}

const letteringMap = {
	company: "P",
	player: "E",
	supporter: "S",
} as const satisfies Record<ClubReferredUserType, string>;

export const ClubReferredCardFront = ({
	flip,
	personalInfo,
}: ClubReferredCardFrontProps) => {
	const { avatar, name, id, userType, industry, club } = personalInfo;
	return (
		<div
			id={`${userType}-card-${id}-front`}
			className="w-full max-w-sm rounded-2xl bg-blue-900 p-0.5"
			style={{
				backgroundColor: club?.preferredColor,
			}}>
			{/* Main content area */}
			<div className="relative z-30 h-[28.125rem] sm:h-[31.25rem] md:h-[37.5rem]">
				{/* Top row elements */}
				<div className="absolute top-0 z-20 flex w-full items-start justify-between px-3 py-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm sm:h-12 sm:w-12">
						<span className="text-lg font-bold text-blue-900 sm:text-xl">
							{letteringMap[userType]}
						</span>
					</div>

					{userType !== "company" && (
						<div className="flex flex-col items-end justify-center gap-3 sm:gap-4">
							<div className="relative flex h-8 w-8 items-center justify-center rounded-lg sm:h-10 sm:w-10">
								<Shirt
									className="absolute size-12 fill-white text-white sm:size-14"
									style={{
										color: club?.preferredColor,
										fill: club?.preferredColor,
									}}
								/>
								<span
									className="z-20 text-sm font-bold text-blue-900 sm:text-base"
									style={{
										color: club?.preferredColor
											? getDifferenceColor(
													club.preferredColor,
												)
											: undefined,
									}}>
									{personalInfo.shirtNumber ?? 0}
								</span>
							</div>
						</div>
					)}
				</div>

				<div className="relative h-full overflow-hidden rounded-xl border-y">
					<img
						src={
							userType === "company"
								? personalInfo.secondaryAvatar
								: avatar
						}
						alt={`${name} avatar`}
						className="size-full object-cover object-top"
					/>

					{/* Bottom row of icons */}
					<div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col rounded-2xl border border-white/30 bg-black/10 backdrop-blur-sm">
						<div className="flex flex-col items-center gap-2 p-4 pb-0 text-center text-white">
							<h2 className="mb-1 text-xl font-bold capitalize sm:text-2xl md:text-3xl">
								{name}
							</h2>

							{userType === "company" &&
								(industry
									? getPathDominantItem(industry)
									: "--")}
							{userType !== "company" &&
								!!personalInfo.jobRole?.primary &&
								getPathName(personalInfo.jobRole?.primary)}
						</div>

						{/* Footer section */}
						<div className="flex w-full items-center justify-between gap-4 p-2 pt-0">
							<FlipButton flip={flip} />

							<LogoBanner
								logo={club?.avatar}
								altText="club logo"
								className="size-auto max-h-[123.21px] flex-1"
							/>

							{userType !== "company" ? (
								<Badge className="rounded-full bg-white text-lg font-bold text-blue-900 shadow-sm sm:text-xl">
									{personalInfo.score ?? 0}
								</Badge>
							) : (
								// pseudo div for consistent layout
								<div
									className="size-14"
									role="presentation"></div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
