/** @format */

import {
	TabPanelsNavigation,
	TabRouteItem,
} from "@/components/common/tab-panels";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { FC, useMemo } from "react";
import { href, redirect } from "react-router";
import { AllowedProfileUserTypeSchema } from "../profile/schemas";
import { Route } from "./+types/route";

export const clientLoader = ({ request }: Route.ClientLoaderArgs) => {
	const { pathname } = new URL(request.url);
	if (pathname === href("/settings")) {
		return redirect(href("/settings/profile"));
	}
};

const tabRoutes = [
	{
		path: href("/settings/profile"),
		label: "Edit Profile",
	},
	{
		path: href("/settings/password"),
		label: "Change Password",
	},
	{
		path: href("/settings/notifications"),
		label: "Notifications",
	},
] as const satisfies TabRouteItem[];

const UserSettingsLayout: FC = () => {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
	});
	const userType = cookies.userType;

	const filteredRoutes = useMemo(() => {
		const shouldIncludeProfile =
			AllowedProfileUserTypeSchema.safeParse(userType).success;

		if (shouldIncludeProfile) {
			return tabRoutes;
		}

		return tabRoutes.filter(
			({ path }) => path !== href("/settings/profile"),
		);
	}, [userType]);

	return <TabPanelsNavigation tabs={filteredRoutes} />;
};

export default UserSettingsLayout;
