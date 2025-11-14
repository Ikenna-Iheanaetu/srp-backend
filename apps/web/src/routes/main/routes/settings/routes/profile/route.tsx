/** @format */

import UserComponentByType, {
	LazyLoadedUserComponentsMap,
} from "@/components/common/render-user-component-by-type";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { FC, lazy } from "react";
import { ALLOWED_PROFILE_USER_TYPES } from "../../../profile/schemas";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: ALLOWED_PROFILE_USER_TYPES,
	}).redirect;
};

const CompanyProfileSettings = lazy(() => import("./company"));
const ClubProfileSettings = lazy(() => import("./club"));
const PlayerProfileSettings = lazy(() => import("./player/form"));

const componentsMap = {
	company: CompanyProfileSettings,
	player: PlayerProfileSettings,
	supporter: PlayerProfileSettings,
	club: ClubProfileSettings,
} satisfies LazyLoadedUserComponentsMap;

const ProfileSettingsRoute: FC = () => {
	return <UserComponentByType componentsMap={componentsMap} />;
};

export default ProfileSettingsRoute;
