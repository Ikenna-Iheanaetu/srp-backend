/** @format */

import UserComponentByType, {
	LazyLoadedUserComponents,
} from "@/components/common/render-user-component-by-type";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { FC, lazy } from "react";
import {
	AllowedProfileUserType,
	AllowedProfileUserTypeSchema,
} from "./schemas";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: AllowedProfileUserTypeSchema.options,
	}).redirect;
};

const CompanyProfilePage = lazy(() => import("./company"));
const PlayerProfilePage = lazy(() => import("./player"));
const ClubProfilePage = lazy(() => import("./club"));

const userComponents = {
	company: CompanyProfilePage,
	player: PlayerProfilePage,
	supporter: PlayerProfilePage,
	club: ClubProfilePage,
} satisfies LazyLoadedUserComponents<AllowedProfileUserType>;

const UserProfileRoute: FC = () => {
	return <UserComponentByType componentsMap={userComponents} />;
};

export default UserProfileRoute;
