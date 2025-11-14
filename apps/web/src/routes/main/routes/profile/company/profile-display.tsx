/** @format */

import { BadgeItemsList } from "@/components/common/badge-list";
import { LinkButton } from "@/components/common/link-btn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import CompanyDataCard from "@/components/user-dynamic-cards/partner";
import { getPathDominantItem } from "@/lib/helper-functions/generic-string-helpers";
import { cn } from "@/lib/utils";
import {
	Crumbs,
	CrumbsLocationState,
} from "@/routes/main/components/app-header/bread-crumb-navigation";
import { User } from "lucide-react";
import React from "react";
import { href, To, useLocation, useNavigate } from "react-router";
import { ApiEntityResponseRecord } from "../../entity/query-factory";
import { serializeNewChatSearchParams } from "../../messages/routes/new/search-params";
import { AddItemLink } from "../components/add-item-link";
import ActiveJobsList from "./active-jobs-listing";
import { CompanyProfileData } from "./use-fetch-profile";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { PlayerUserTypesSchema } from "@/lib/schemas/user";

const useChatNavigatePropsForEntitryView = (
	data: ApiEntityResponseRecord["company"],
) => {
	const currentLocation = useLocation();

	const navigateTo: To = React.useMemo(() => {
		if (data.chatId) {
			return href("/messages/:id", {
				id: data.chatId,
			});
		}
		return {
			pathname: href("/messages/new"),
			search: serializeNewChatSearchParams({
				recipientId: data.userId,
			}),
		};
	}, [data.chatId, data.userId]);

	const stateForTarget: CrumbsLocationState = React.useMemo(() => {
		let crumbs: Crumbs = [
			{
				to: currentLocation,
				label: `${data.name} profile`,
			},
		];

		if (data.chatId) {
			crumbs = [
				...crumbs,
				{
					label: `Chat with ${data.name}`,
				},
			] as Crumbs;
		} else {
			crumbs = [
				...crumbs,
				{
					label: "Send a message",
				},
			] as Crumbs;
		}

		return {
			crumbs,
		};
	}, [currentLocation, data.chatId, data.name]);

	return {
		navigateTo,
		stateForTarget,
	};
};

const CompanyEntityCard = ({
	companyData,
}: {
	companyData: ApiEntityResponseRecord["company"];
}) => {
	const { navigateTo, stateForTarget } =
		useChatNavigatePropsForEntitryView(companyData);

	const navigate = useNavigate();

	const { cookies } = useAuthStatus({ assertAuthenticated: false });
	const loggedInUserType = cookies?.userType;

	const canMessage =
		PlayerUserTypesSchema.safeParse(loggedInUserType).success;
	return (
		<CompanyDataCard
			companyData={companyData}
			onMessage={
				canMessage
					? () => {
							void navigate(navigateTo, {
								state: stateForTarget,
							});
						}
					: undefined
			}
		/>
	);
};

type CompanyProfileDisplayProps =
	| {
			data: CompanyProfileData;
			isEntityView?: false;
	  }
	| {
			data: ApiEntityResponseRecord["company"];
			isEntityView: true;
	  };

export const CompanyProfileDisplay: React.FC<CompanyProfileDisplayProps> = ({
	data: profileData,
	isEntityView,
}) => {
	const paragraphStyles = "text-sm text-slate-500";

	return (
		profileData && (
			<div className="flex flex-col gap-8">
				{/* Header section */}
				<header className={cn("flex flex-col justify-between gap-16")}>
					<div
						className="relative aspect-profile-banner"
						style={{
							background: profileData?.club.banner
								? undefined
								: "linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%)",
						}}>
						{/* club banner */}
						{profileData?.club.banner && (
							<img
								className="absolute left-0 top-0 size-full object-cover"
								src={profileData.club.banner}
							/>
						)}

						<Avatar className="absolute inset-y-[20%] left-8 aspect-square size-auto border-2 border-white">
							<AvatarImage
								src={profileData.avatar}
								alt={profileData.name + "Profile photo"}
								className="object-cover"
							/>
							<AvatarFallback>
								<User />
							</AvatarFallback>
						</Avatar>
					</div>

					{/* Profile name and description */}
					<div className="flex flex-col items-center capitalize">
						<h1 className="text-2xl font-semibold capitalize">
							{profileData.name}
						</h1>

						<p
							className={cn(
								paragraphStyles,
								"text-base capitalize",
							)}>
							{profileData.industry
								? getPathDominantItem(profileData.industry)
								: !isEntityView && (
										<AddItemLink>add industry</AddItemLink>
									)}
						</p>

						<p
							className={cn(
								paragraphStyles,
								"text-base capitalize",
							)}>
							<strong>Region</strong>:{" "}
							{profileData.region?.primary ??
								(!isEntityView && (
									<AddItemLink>
										add Primary Region
									</AddItemLink>
								))}
						</p>

						<p
							className={cn(
								paragraphStyles,
								"text-base capitalize",
							)}>
							<strong>Address</strong>:{" "}
							{profileData.address ?? (
								<AddItemLink isEntityView={isEntityView}>
									add Address
								</AddItemLink>
							)}
						</p>
					</div>
				</header>

				{/* Profile description details */}
				<section className="flex flex-col gap-8">
					{/* Tagline and edit button */}
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
						{!isEntityView && (
							<LinkButton
								to={"/settings/profile"}
								className="col-start-2 w-fit justify-self-end button md:col-start-3">
								Edit Profile
							</LinkButton>
						)}

						<div className="col-span-2 row-start-2 md:row-start-1">
							<h2>Tagline</h2>
							<p className={cn(paragraphStyles)}>
								{profileData.tagline ??
									(!isEntityView && (
										<AddItemLink>add tagline</AddItemLink>
									))}
							</p>
						</div>

						<Separator className="col-span-full" />
					</div>

					{/* Other details */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
						{/* Left column (spans 2 columns on desktop) */}
						<div className="space-y-6 xl:col-span-2">
							{/* About */}
							<div>
								<h2>About</h2>
								<p className={cn(paragraphStyles)}>
									{profileData.about ??
										(!isEntityView && (
											<AddItemLink>add about</AddItemLink>
										))}
								</p>
							</div>

							<div>
								<h2>Secondary Regions</h2>

								{profileData.region?.secondary?.length ? (
									<BadgeItemsList
										items={profileData.region.secondary}
									/>
								) : (
									!isEntityView && (
										<AddItemLink>
											add secondary regions
										</AddItemLink>
									)
								)}
							</div>

							{/* CompanyDynamicCard for mobile (after About) */}
							<div className="block lg:hidden">
								{isEntityView ? (
									<CompanyEntityCard
										companyData={profileData}
									/>
								) : (
									<CompanyDataCard
										companyData={profileData}
									/>
								)}
							</div>

							{/* 
                            Workspace culture
                            TODO: Restore when backend has prepared questionnaire functionality
                             */}
							{/* <div>
								<h2>Workspace culture</h2>
								{profileData.isQuestionnaireTaken ? (
									<>
										<p className={cn(paragraphStyles)}>
											Your score: {profileData.score}
										</p>
										<p>
											Analysis Result:{" "}
											{profileData.analisys_result}
										</p>
									</>
								) : (
									<AddItemLink
										isEntityView={isEntityView}
										to={href("/onboarding/questionnaire")}>
										Complete Questionnaire
									</AddItemLink>
								)}
							</div> */}
						</div>

						{/* Right column (desktop only) */}

						<div className="hidden lg:block">
							{isEntityView ? (
								<CompanyEntityCard companyData={profileData} />
							) : (
								<CompanyDataCard companyData={profileData} />
							)}
						</div>
					</div>
				</section>

				{/* Active job listings */}
				{!isEntityView && (
					<section>
						<ActiveJobsList />
					</section>
				)}
			</div>
		)
	);
};
