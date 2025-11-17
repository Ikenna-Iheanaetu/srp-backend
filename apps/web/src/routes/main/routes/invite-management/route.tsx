/** @format */

import {
	TabPanelsNavigation,
	TabRouteItem,
} from "@/components/common/tab-panels";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { href, redirect } from "react-router";
import { Route } from "./+types/route";

export const clientLoader = ({ request }: Route.ClientLoaderArgs) => {
	const restrictionRedirect = restrictRouteByUserType({
		allowedUserTypes: ["admin"],
	}).redirect;
	if (restrictionRedirect) {
		return restrictRouteByUserType;
	}

	const { pathname } = new URL(request.url);
	if (pathname === href("/invite-management")) {
		return redirect(href("/invite-management/invites-to-approve"));
	}
};

const tabRoutes = [
	{
		path: href("/invite-management/invites-to-approve"),
		label: "Invites to approve",
	},
	{
		// TODO: Implement route component for unclaimed-invites
		path: "/invite-management/unclaimed-invites",
		label: "unclaimed invites",
	},
] satisfies TabRouteItem[];

export default function InvitesManagmentRoute() {
	return <TabPanelsNavigation tabs={tabRoutes} />;
}
