/** @format */

import { BadgeItemsList } from "@/components/common/badge-list";
import { FileListMapper } from "@/components/common/file-item-mapper";
import { ExperienceCard } from "@/components/common/form/work-experience-section";
import { LinkButton } from "@/components/common/link-btn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PlayerDynamicCard } from "@/components/user-dynamic-cards/player-card";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { cn } from "@/lib/utils";
import {
	Crumbs,
	CrumbsLocationState,
} from "@/routes/main/components/app-header/bread-crumb-navigation";
import { Mail, User } from "lucide-react";
import React from "react";
import { href, To, useLocation, useNavigate } from "react-router";
import { ApiEntityResponseRecord } from "../../../entity/query-factory";
import { serializeNewChatSearchParams } from "../../../messages/routes/new/search-params";
import { getPathName } from "../../../onboarding/routes/index/step2/player/components/role-section/job-taxonomy-dropdown";
import { PlayerProfileData } from "../use-player-profile-data";
import { EmploymentTypesSection } from "./employment-types";
import { PreferredJobRoleSection } from "./preferred-job-role";

const useChatNavigatePropsForEntitryView = (
	data: ApiEntityResponseRecord["player" | "supporter"],
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

const PlayerEntityCard = ({
	data,
}: {
	data: ApiEntityResponseRecord["player" | "supporter"];
}) => {
	const { navigateTo, stateForTarget } =
		useChatNavigatePropsForEntitryView(data);

	const navigate = useNavigate();

	const { cookies } = useAuthStatus({ assertAuthenticated: false });
	const loggedInUserType = cookies?.userType;

	const canMessage = loggedInUserType === "company";

	return (
		<PlayerDynamicCard
			{...data}
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

const ChatLinkButton = ({
	data,
}: {
	data: ApiEntityResponseRecord["player" | "supporter"];
}) => {
	const { navigateTo, stateForTarget } =
		useChatNavigatePropsForEntitryView(data);

	return (
		<LinkButton
			to={navigateTo}
			state={stateForTarget}
			size={"icon"}
			variant={"ghost"}>
			<Mail />
		</LinkButton>
	);
};

type PlayerOrSupporterProfileDisplayProps =
	| {
			data: PlayerProfileData;
			isEntityView?: false;
	  }
	| {
			data: ApiEntityResponseRecord["player" | "supporter"];
			isEntityView: true;
	  };

export const PlayerOrSupporterProfileDisplay: React.FC<
	PlayerOrSupporterProfileDisplayProps
> = (props) => {
	const { isEntityView = false, data } = props;
	const h2Styles = "text-xl font-semibold";

	const { cookies } = useAuthStatus({ assertAuthenticated: false });
	const loggedInUserType = cookies?.userType;

	const canMessage = props.isEntityView && loggedInUserType === "company";

	return (
		<div className={cn("flex flex-col")}>
			{/* Hero Banner */}
			<header className="flex flex-col">
				<div
					className="relative aspect-profile-banner"
					style={{
						background: data?.club.banner
							? undefined
							: "linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%)",
					}}>
					{/* club banner */}
					{data?.club.banner && (
						<img
							className="absolute left-0 top-0 size-full object-cover"
							src={data.club.banner}
						/>
					)}

					<Avatar className="absolute inset-y-[20%] left-8 aspect-square size-auto border-2 border-white">
						<AvatarImage
							src={data.avatar}
							alt={data.name + "Profile photo"}
							className="object-cover"
						/>
						<AvatarFallback>
							<User />
						</AvatarFallback>
					</Avatar>

					{!isEntityView && (
						<div className="absolute right-4 top-4">
							<LinkButton
								to={href("/settings/profile")}
								variant="outline"
								size="sm"
								className="bg-white hover:bg-white/90">
								Edit Profile
							</LinkButton>
						</div>
					)}
				</div>

				<div className="mt-12 px-8">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-semibold capitalize">
							{data.name}
						</h1>

						<div className="flex flex-col items-start gap-2">
							{canMessage && <ChatLinkButton data={props.data} />}

							{/* 
                            TODO: Restore when backend has prepared questionnaire functionality
                            */}
							{/* {!data?.isQuestionnaireTaken && !isEntityView && (
								<AddItemLink
									to={href("/onboarding/questionnaire")}>
									Complete questionnaire
								</AddItemLink>
							)} */}
						</div>
					</div>

					<p className="text-muted-foreground capitalize">
						Location: {data.address}{" "}
						{data.country && `, ${data.country}`}.
					</p>
				</div>
			</header>

			{/* Main content */}
			<div className="px-8 py-6">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Left column */}
					<div className="space-y-6 lg:col-span-2">
						{/* Current role section */}
						<div className="space-y-2">
							<h2 className={h2Styles}>Current Role</h2>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{data.jobRole?.primary
									? getPathName(data.jobRole.primary)
									: "Not specified"}
							</p>
						</div>

						<div className="space-y-2">
							<h2 className={h2Styles}>Years of Experience</h2>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{data.yearsOfExperience ?? "Not specified"}
							</p>
						</div>

						<div className="space-y-2">
							<h2 className={h2Styles}>Availability for work</h2>

							{data.workAvailability ? (
								<Badge
									variant={
										data.workAvailability
											? "default"
											: "destructive"
									}>
									{data.workAvailability
										? "Available"
										: "Not Available"}
								</Badge>
							) : (
								<p className="text-muted-foreground text-sm leading-relaxed">
									Not specified
								</p>
							)}
						</div>

						<div className="space-y-2">
							<h2 className={h2Styles}>Preferred work regions</h2>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{data.workLocations?.length ? (
									<BadgeItemsList
										items={data.workLocations}
									/>
								) : (
									"Not specified"
								)}
							</p>
						</div>

						{/* About section */}
						<div className="space-y-2">
							<h2 className={h2Styles}>About</h2>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{data.about}
							</p>
						</div>

						{data.employmentType?.primary && (
							<EmploymentTypesSection
								primaryType={data.employmentType.primary}
								secondaryTypes={data.employmentType.secondary}
							/>
						)}

						{data.jobRole?.primary && (
							<PreferredJobRoleSection
								primaryType={
									getPathName(data.jobRole.primary) ?? ""
								}
								secondaryTypes={data.jobRole.secondary?.map(
									(val) => getPathName(val) ?? "",
								)}
							/>
						)}

						{/* PlayerDynamicCard for mobile (after About) */}
						<div className="block lg:hidden">
							{props.isEntityView ? (
								<PlayerEntityCard data={props.data} />
							) : (
								<PlayerDynamicCard {...props.data} />
							)}
						</div>

						{/* Skills section */}
						{data.skills && (
							<div className="space-y-2">
								<h2 className={h2Styles}>Skills</h2>
								<BadgeItemsList items={data.skills} />
							</div>
						)}

						{/* Key Traits section */}
						{data.traits && (
							<div className="space-y-2">
								<h2 className={h2Styles}>Key Traits</h2>
								<BadgeItemsList
									items={data.traits}
									variant="outline"
								/>
							</div>
						)}

						{/* Work Experience section */}
						<div className="space-y-2">
							<h2 className={h2Styles}>Work Experience</h2>

							<div className="space-y-4 text-sm">
								{data.experiences?.map((exp) => {
									return (
										<ExperienceCard
											key={exp.title + exp.company}
											experience={exp}
											isForm={false}
										/>
									);
								})}
							</div>
						</div>
					</div>

					{/* Right column */}
					<div className="space-y-6">
						{/* PlayerDynamicCard for desktop */}
						<div className="hidden lg:block">
							{props.isEntityView ? (
								<PlayerEntityCard data={props.data} />
							) : (
								<PlayerDynamicCard {...props.data} />
							)}
						</div>

						{/* Certifications */}
						<FileListMapper
							className="mb-4"
							title={
								<span className={cn(h2Styles)}>
									Certifications
								</span>
							}
							fileNames={data.certifications ?? []}
						/>

						{/* Resume */}
						<FileListMapper
							className="mb-4"
							title={<span className={cn(h2Styles)}>Resume</span>}
							fileNames={data.resume ? [data.resume] : []}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
