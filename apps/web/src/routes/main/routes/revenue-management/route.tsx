/** @format */

import UserComponentByType, {
	LazyLoadedUserComponents,
} from "@/components/common/render-user-component-by-type";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { UserType } from "@/lib/schemas/user";
import React from "react";

type AllowedRevenueManagementUser = SafeExtract<UserType, "club">;

const allowedUserTypes = [
	"club",
] as const satisfies AllowedRevenueManagementUser[];

export const clientLoader = () => {
	return restrictRouteByUserType({ allowedUserTypes }).redirect;
};

const Club = React.lazy(() => import("./club"));

const components = {
	club: Club,
} satisfies LazyLoadedUserComponents<AllowedRevenueManagementUser>;

export default function RevenueManagementRoute() {
	return <UserComponentByType componentsMap={components} />;
}