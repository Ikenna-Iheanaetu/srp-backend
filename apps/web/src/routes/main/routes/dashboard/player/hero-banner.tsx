/** @format */

import { LinkButton } from "@/components/common/link-btn";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { FC } from "react";
import { href } from "react-router";
import { usePlayerProfileData } from "../../profile/player/use-player-profile-data";

interface Props {
	className?: string;
	recommendations: number;
}

const HeroBanner: FC<Props> = ({ className, recommendations }) => {
	const { data: userProfile } = usePlayerProfileData();

	return (
		<header className={cn(className)}>
			<Card
				className="w-full max-h-48 aspect-hero-banner h-auto text-white border-none p-4 md:p-8 flex flex-col justify-between"
				style={{
					background:
						"linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%)",
				}}>
				<CardHeader className="pt-0 px-0 space-y-0">
					<CardTitle className="text-4xl capitalize">
						{userProfile?.name}
					</CardTitle>

					<CardDescription>
						<p className="font-medium text-white">
							<strong className="text-xl">
								{recommendations}
							</strong>{" "}
							Recommended Jobs for You
						</p>
					</CardDescription>
				</CardHeader>

				<CardFooter className="justify-end p-2">
					<LinkButton
						variant="outline"
						className={cn(
							"text-white border-white bg-transparent flex items-center gap-2",
							"transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95 group"
						)}
						to={href("/jobs/tracking")}>
						<span>Track</span>
						<ArrowRight className="stroke-slate-400 group-hover:stroke-slate-500 transform transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
					</LinkButton>
				</CardFooter>
			</Card>
		</header>
	);
};

export default HeroBanner;
