/** @format */

import UserComponentByType, {
	LazyLoadedUserComponents,
} from "@/components/common/render-user-component-by-type";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { UserType } from "@/lib/schemas/user";
import React from "react";

type AllowedAffiliateManagementUser = SafeExtract<UserType, "admin" | "club">;

const allowedUserTypes = [
	"admin",
	"club",
] as const satisfies AllowedAffiliateManagementUser[];

export const clientLoader = () => {
	return restrictRouteByUserType({ allowedUserTypes }).redirect;
};

const Club = React.lazy(() => import("./club/tabs"));
const Admin = React.lazy(() => import("./admin"));

const components = {
	club: Club,
	admin: Admin,
} satisfies LazyLoadedUserComponents<AllowedAffiliateManagementUser>;

export default function AffiliateManagementRoute() {
	return <UserComponentByType componentsMap={components} />;
}
