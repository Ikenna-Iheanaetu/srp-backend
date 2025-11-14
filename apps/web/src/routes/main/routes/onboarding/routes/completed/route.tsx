/** @format */

import { FC, lazy } from "react";

import UserComponentByType, {
	LazyLoadedUserComponents,
} from "@/components/common/render-user-component-by-type";
import { Button } from "@/components/ui/button";
import { href, Link } from "react-router";
import { AllowedProfileUserType } from "../../../profile/schemas";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";

const PlayerProfilePage = lazy(() => import("../../../profile/player"));
const CompanyProfilePage = lazy(() => import("../../../profile/company"));
const ClubProfilePage = lazy(() => import("../../../profile/club"));

const componentsMap = {
	player: PlayerProfilePage,
	supporter: PlayerProfilePage,
	company: CompanyProfilePage,
	club: ClubProfilePage,
} satisfies LazyLoadedUserComponents<AllowedProfileUserType>;

const OnboardingCompletedRoute: FC = () => {
	const { cookies } = useAuthStatus({ assertAuthenticated: true });
	const userType = cookies.userType;

	return (
		<div className="grid grid-cols-1 gap-8 max-h-dvh overflow-auto md:p-4 tw-scrollbar">
			<UserComponentByType componentsMap={componentsMap} />

			<div className="flex justify-evenly gap-4">
				<Button asChild variant={"link"} className="text-slate-500">
					<Link to={href("/profile")}>Profile</Link>
				</Button>

				{(userType === "player" || userType === "supporter") && (
					<Button
						asChild
						variant={"link"}
						className="underline text-blue-700">
						<Link to={href("/jobs/search")}>Search Jobs</Link>
					</Button>
				)}

				<Button asChild className="button">
					<Link to={href("/dashboard")}>Continue to Dashboard</Link>
				</Button>
			</div>
		</div>
	);
};

export default OnboardingCompletedRoute;
