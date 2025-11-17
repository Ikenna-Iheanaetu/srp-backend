/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { Separator } from "@/components/ui/separator";

import LoadingIndicator from "@/components/common/loading-indicator";
import { Badge } from "@/components/ui/badge";
import ClubDynamicCard from "@/components/user-dynamic-cards/club-card";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { cn } from "@/lib/utils";
import {
	IconType,
	SiFacebook,
	SiInstagram,
	SiX,
} from "@icons-pack/react-simple-icons";
import { FC } from "react";
import { AvatarAndBanner } from "./avatar-and-banner";
import { ProfileLinks, SocialLink } from "./profile-links";
import { ClubProfileData, useClubProfile } from "./use-fetch-profile";

const socialLinksIcons = {
	facebook: SiFacebook,
	instagram: SiInstagram,
	twitter: SiX,
} satisfies Record<keyof ClubProfileData["socials"], IconType>;

const ClubProfilePage: FC = () => {
	const { data: profileData, isLoading } = useClubProfile();

	if (!profileData && isLoading) return <LoadingIndicator />;

	const paragraphStyles = "text-sm text-slate-500";

	return (
		profileData && (
			<div className="flex flex-col gap-8">
				{/* Header section */}
				<header className={cn("flex flex-col gap-16 justify-between")}>
					{/* profile banner and picture */}
					<AvatarAndBanner
						banner={getFileNameUrl(profileData?.banner)}
					/>

					{/* Profile name and description */}
					<div className="flex flex-col items-center capitalize">
						<h1 className="text-2xl font-semibold">
							{profileData.name}
						</h1>
						<p className={cn(paragraphStyles, "text-base")}>
							{profileData.category}
						</p>
						<p className={cn(paragraphStyles, "text-base")}>
							<strong>Address:</strong>{" "}
							{profileData.address
								? `${profileData.address.postalCode} ${profileData.address.street}, ${profileData.address.city}`
								: "Not specified"}
						</p>
					</div>
				</header>

				{/* Profile description details */}
				<section className="flex flex-col gap-8">
					<LinkButton
						to={"/settings/profile"}
						className="button w-fit col-start-2 md:col-start-3 justify-self-end">
						Edit Profile
					</LinkButton>

					<Separator className="col-span-full" />

					{/* Other details */}
					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
						{/* Left column (spans 2 columns on desktop) */}
						<div className="xl:col-span-2 space-y-6">
							{/* About */}
							<div>
								<h2 className="heading-2">About</h2>
								<p className={cn(paragraphStyles)}>
									{profileData.about?.trim() === ""
										? "No description yet"
										: profileData.about}
								</p>
							</div>

							<div className="space-y-2">
								<h2 className="heading-2">Sports Category</h2>
								<p className={cn(paragraphStyles)}>
									{profileData.category?.trim() === "" ? (
										"Not specified"
									) : (
										<Badge variant={"secondary"}>
											{profileData.category}
										</Badge>
									)}
								</p>
							</div>
							<div className="space-y-2">
								<h2 className="heading-2">Region</h2>
								<p className={cn(paragraphStyles)}>
									{profileData.region ? (
										<Badge variant={"secondary"}>
											{profileData.region}
										</Badge>
									) : (
										"Not specified"
									)}
								</p>
							</div>

							<ProfileLinks
								website={profileData.website}
								socialLinks={(() => {
									const links = profileData.socials;
									if (!links) return [];
									const keys = Object.keys(
										links
									) as (keyof NonNullable<
										ClubProfileData["socials"]
									>)[];

									const array: SocialLink[] = [];
									for (const key of keys) {
										const url = links[key];
										if (!url) {
											continue;
										}
										array.push({
											platform: key,
											url,
											Icon: socialLinksIcons[key],
										});
									}
									return array;
								})()}
							/>

							{/* PlayerDynamicCard for mobile (after About) */}
							<div className="block lg:hidden">
								<ClubDynamicCard clubInfo={profileData} />
							</div>
						</div>

						{/* Right column (desktop only) */}

						<div className="hidden lg:block">
							<ClubDynamicCard clubInfo={profileData} />
						</div>
					</div>
				</section>
			</div>
		)
	);
};

export default ClubProfilePage;
