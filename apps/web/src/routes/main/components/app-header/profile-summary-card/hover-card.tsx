/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { cn } from "@/lib/utils";
import { profileQueries } from "@/routes/main/routes/profile/query-factory";
import { AllowedProfileUserTypeSchema } from "@/routes/main/routes/profile/schemas";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { FC } from "react";
import { href, Link } from "react-router";

const ProfileSummaryHoverCard: FC = () => {
	const { cookies } = useAuthStatus({ assertAuthenticated: true });
	const userTypeWithProfile = AllowedProfileUserTypeSchema.safeParse(
		cookies.userType
	).data;
	const { data: profile } = useQuery({
		...profileQueries.byUserType(userTypeWithProfile!),
		enabled: !!userTypeWithProfile,
	});

	if (!userTypeWithProfile) {
		return null;
	}

	const noContentStyles = "text-gray-500";

	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<Link to={href("/profile")}>
					<Avatar>
						<AvatarImage
							className="object-cover"
							src={getFileNameUrl(profile?.avatar)}
						/>
						<AvatarFallback>
							<User />
						</AvatarFallback>
					</Avatar>
				</Link>
			</HoverCardTrigger>

			<HoverCardContent asChild align="start" sideOffset={10}>
				<Card className="p-0 w-80 mr-2 rounded-2xl">
					<CardHeader className="gap-4 justify-between">
						{/* for accessibility tools */}
						<div className="sr-only">
							<CardTitle>Profile Summary Card</CardTitle>
							<CardDescription>
								This is a summary of your profile information.
							</CardDescription>
						</div>

						<Link to={"/profile"}>
							<Avatar className="aspect-square w-20 h-auto shadow-md border-2 border-white">
								<AvatarImage
									src={getFileNameUrl(profile?.avatar)}
								/>
								<AvatarFallback>
									<User />
								</AvatarFallback>
							</Avatar>
						</Link>

						<LinkButton
							variant={"link"}
							to={href("/profile")}
							className="text-2xl font-semibold">
							{profile?.name}
						</LinkButton>
					</CardHeader>

					<CardContent>
						{profile?.about ? (
							<p className="text-sm">{profile?.about}</p>
						) : (
							<span className={cn(noContentStyles)}>
								No about
							</span>
						)}
					</CardContent>

					<CardFooter className="flex-col items-start text-sm gap-1">
						{profile?.website ? (
							<a
								rel="noreferrer"
								href={profile.website}
								className="text-blue-700 underline"
								target="_blank">
								{profile.website}
							</a>
						) : (
							<span className="text-gray-500">No website</span>
						)}
						<a
							rel="noreferrer"
							href={"mailto:" + profile?.email}
							className="text-blue-700"
							target="_blank">
							{profile?.email}
						</a>
					</CardFooter>
				</Card>
			</HoverCardContent>
		</HoverCard>
	);
};

export default ProfileSummaryHoverCard;
