/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import { FC } from "react";
import { PlayerOrSupporterProfileDisplay } from "./profile-display";
import {
	PlayerProfileData,
	usePlayerProfileData,
} from "./use-player-profile-data";

type PlayerProfilePageProps =
	| {
			isEntity: true;
			entityData: PlayerProfileData;
			className?: string;
	  }
	| {
			className?: string;
			entityData?: never;
			isEntity?: false;
	  };

const PlayerProfilePage: FC<PlayerProfilePageProps> = ({
	isEntity,
	entityData,
}) => {
	const { data: userProfile, isLoading } = usePlayerProfileData({
		isEntity,
	});

	const profileData = isEntity ? entityData : userProfile;

	if (isLoading || !profileData) {
		return <LoadingIndicator />;
	}

	return <PlayerOrSupporterProfileDisplay data={profileData} />;
};

export default PlayerProfilePage;
