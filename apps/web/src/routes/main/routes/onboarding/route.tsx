/** @format */

import SiteLogo from "@/components/common/site-logo";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { RightSidebar } from "@/routes/auth/components/auth-display-layout";
import { FC } from "react";
import { Outlet } from "react-router";
import { ALLOWED_PROFILE_USER_TYPES } from "../profile/schemas";

export const clientLoader = () => {
	const { redirect: restrictionRedirect } = restrictRouteByUserType({
		allowedUserTypes: ALLOWED_PROFILE_USER_TYPES,
	});

	if (restrictionRedirect) {
		return restrictionRedirect;
	}
};

const OnboardingStepsLayoutRoute: FC = () => {
	return (
		<main className="flex h-dvh bg-gray-100 @container/profile lg:justify-between">
			<div className="flex flex-1 flex-col gap-4 px-8 py-4 md:px-16 md:py-8 h-xs:py-4">
				<SiteLogo
					classNames={{
						logoText: "!bg-none text-black",
						icon: "brightness-0 grayscale",
					}}
				/>

				<Outlet />
			</div>

			<RightSidebar />
		</main>
	);
};

export default OnboardingStepsLayoutRoute;
