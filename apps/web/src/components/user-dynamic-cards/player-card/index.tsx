/** @format */

import { PlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import { Merge } from "@/types";
import React from "react";
import { ClubReferredCardFront } from "../club-referred-card-front";
import CardFlip from "../filp-container";
import PlayerCardBack from "./player-card-back";

export type PlayerDynamicCardData = Merge<
	PlayerProfileData,
	{
		preferredRegions?: string[];
	}
>;

export const PlayerDynamicCard = (
	props: PlayerDynamicCardData & { onMessage?: () => void },
) => {
	const cardFrontRef = React.useRef<HTMLDivElement | null>(null);

	return (
		<CardFlip
			frontRef={cardFrontRef}
			front={(flip) => (
				<ClubReferredCardFront personalInfo={props} flip={flip} />
			)}
			back={(flip) => (
				<PlayerCardBack
					cardFrontRef={cardFrontRef}
					personalInfo={props}
					onMessage={props.onMessage}
					flip={flip}
				/>
			)}
		/>
	);
};
